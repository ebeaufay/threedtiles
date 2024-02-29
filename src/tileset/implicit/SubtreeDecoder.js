async function fetchAndDecodeSubtree(url) {
    const cleanUrl = url.split('?')[0]; // Remove URL parameters
    const extension = cleanUrl.split('.').pop(); // Get the file extension

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    if (extension === "json") {
        // Handle .json file
        const json = await response.json();
        return handleJSONSubtree(json, getDirectoryUrl(url));
    }
    if (extension === "subtree") {
        // Handle binary .subtree file
        const buffer = await response.arrayBuffer();
        return decodeSubtreeBinary(buffer, getDirectoryUrl(url));
    } else {
        throw new Error(`Unsupported file extension: ${extension}`);
    }
}
function getDirectoryUrl(url) {
    const cleanUrl = url.split('?')[0]; // Removes query parameters
    return cleanUrl.substring(0, cleanUrl.lastIndexOf('/') + 1);
};

async function decodeSubtreeJSON(json, baseURL) {
    if (!json.buffers) {
        throw new Error(`subtree has no buffers`);
    }

    const bufferFetchPromises = json.buffers.map(async (buffer) => {
        if (!buffer.uri) {
            throw new Error(`bad subtree definition. subtrees in json format do not contain internal buffers`);
        }
        const binaryUrl = new URL(buffer.uri, baseURL).href; // Fixed to buffer.uri instead of externalBuffer.uri
        const response = await fetch(binaryUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch binary file ${binaryUrl}: ${response.statusText}`);
        }
        return response.arrayBuffer();
    });

    const buffers = await Promise.all(bufferFetchPromises);

    return decodeSubtree(json, buffers);
}
// Decode binary .subtree file
async function decodeSubtreeBinary(buffer, baseURL) {
    const dataView = new DataView(buffer);
    const jsonByteLength = dataView.getBigUint64(8, true); // JSON byte length
    const binaryByteLength = dataView.getBigUint64(16, true); // Binary byte length

    const jsonStart = 24;
    const jsonEnd = jsonStart + Number(jsonByteLength);
    const binaryStart = jsonEnd + (8 - (jsonEnd % 8)) % 8; // Align to 8-byte boundary
    const binaryEnd = binaryStart + Number(binaryByteLength);

    const jsonBuffer = buffer.slice(jsonStart, jsonEnd);
    const jsonString = new TextDecoder().decode(jsonBuffer).trim();
    const json = JSON.parse(jsonString);

    if (!json.buffers) {
        throw new Error(`subtree has no buffers`);
    }

    const bufferFetchPromises = json.buffers.map(async (b) => {
        if (b.uri) {
            const binaryUrl = new URL(b.uri, baseURL).href;
            const response = await fetch(binaryUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch binary file ${binaryUrl}: ${response.statusText}`);
            }
            return new Uint8Array(await response.arrayBuffer());
        } else {
            // Assuming you meant to directly use the buffer for non-URI cases,
            // which is already available in the function scope.
            return new Uint8Array(buffer.slice(binaryStart, binaryEnd));
        }
    });

    const buffers = await Promise.all(bufferFetchPromises);

    return decodeSubtree(json, buffers);
}

function decodeSubtree(json, buffers){
    function isAvailable(availability, index) {
        if (!availability) {
            throw new Error(`incomplete json subtree`);
        }
        if (!!availability.constant) {
            if (availability.constant == 0) {
                return false;
            }
            if (availability.constant == 1) {
                return true;
            }
        }
        if (availability.bitstream == undefined) {
            throw new Error(`json subtree "tileAvailability" does not specify a bitstream`);
        }
        if (!json.bufferViews || !json.bufferViews[availability.bitstream]) {
            throw new Error(`json subtree "bufferViews" does not specify a bitstream`);
        }
        const bufferView = json.bufferViews[availability.bitstream];

        return isAvailable2(buffers[bufferView.buffer], bufferView.byteOffset, index);
    }

    function isAvailable2(buffer, byteOffset, index) {
        const byteIndex = byteOffset + Math.floor(index / 8);
        const bitIndex = index % 8;
        return (buffer[byteIndex] >> bitIndex) & 1 == 1;
    }

    function isTileAvailable(address) {

        let index = 0;
        if (address.z==undefined) {
            index = computeQuadtreeIndex(address.x, address.y, address.level);
        } else {
            index = computeOctreeIndex(address.x, address.y, address.z, address.level);
        }
        return isAvailable(json.tileAvailability, index);
    }
    function isContentAvailable(address) {
        let index = 0;
        if (address.z==undefined) {
            index = computeQuadtreeIndex(address.x, address.y, address.level);
        } else {
            index = computeOctreeIndex(address.x, address.y, address.z, address.level);
        }
        const contentAvailability = [];
        json.contentAvailability.forEach(availability=>{
            contentAvailability.push(isAvailable(availability, index));
        })
        return contentAvailability;
    }
    function isChildSubtreeAvailable(address) {
        let index = 0;
        if (address.z==undefined) {
            index = computeQuadtreeIndex(address.x, address.y);
        } else {
            index = computeOctreeIndex(address.x, address.y, address.z);
        }
        return isAvailable(json.childSubtreeAvailability, index);
    }


    return { isTileAvailable: isTileAvailable, isContentAvailable: isContentAvailable, isChildSubtreeAvailable: isChildSubtreeAvailable };
}

// Handle JSON subtree, fetching external binary file if necessary


function part1By1(n) {
    n &= 0x0000ffff;                  // n = ------------------------fedcba9876543210
    n = (n ^ (n << 8)) & 0x00ff00ff;  // n = ----------------fedcba98--------76543210
    n = (n ^ (n << 4)) & 0x0f0f0f0f;  // n = ------------fedc--------ba98--------7654--------3210
    n = (n ^ (n << 2)) & 0x33333333;  // n = --------fedc----ba98----7654----3210
    n = (n ^ (n << 1)) & 0x55555555;  // n = ----f--e--d--c----b--a--9--8----7--6--5--4----3--2--1--0
    return n;
}

function computeQuadtreeIndex(x, y, level) {
    let offset = 0;
    if (level) {
        offset = (Math.pow(4, level) - 1) / 3;
    }
    return offset + (part1By1(x) | (part1By1(y) << 1));
}

function part1By2(n) {
    n &= 0x000003ff;                  // n = ------------------9876543210
    n = (n ^ (n << 16)) & 0xff0000ff; // n = ----9876--------5432--------10--------------------
    n = (n ^ (n << 8)) & 0x0300f00f;  // n = ----9--8--7--6--------5--4--3--2--------------------
    n = (n ^ (n << 4)) & 0x030c30c3;  // n = ----9-----8--7-----6--------5-----4--3-----2--------
    n = (n ^ (n << 2)) & 0x09249249;  // n = ----9--------8--------7--------6--------5--------4--------3--------2--------
    return n;
}

function computeOctreeIndex(x, y, z, level) {
    let offset = 0;
    if (level) {
        offset = (Math.pow(8, level) - 1) / 7;
    }
    return offset + (part1By2(x) | (part1By2(y) << 1) | (part1By2(z) << 2));
}
export{
    fetchAndDecodeSubtree
};