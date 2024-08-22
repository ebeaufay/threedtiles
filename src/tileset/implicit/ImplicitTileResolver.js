import { fetchAndDecodeSubtree } from './SubtreeDecoder.js';
const subtreeMap = new Map();


async function resolveImplicite(rootTile, url) {
    if (!rootTile.root || !rootTile.root.implicitTiling) {
        return rootTile;
    }

    if (!rootTile.root.content && !rootTile.root.contents) {
        throw new Error("implicit tiling requires a Template URI");
    }

    let isQuad = true;
    if (rootTile.root.implicitTiling.subdivisionScheme) {
        isQuad = "QUADTREE" === rootTile.root.implicitTiling.subdivisionScheme.toUpperCase()
    }
    let subtreeUriTemplate = "";
    if (rootTile.root.implicitTiling.subtrees) {
        if (rootTile.root.implicitTiling.subtrees.uri) {
            subtreeUriTemplate = rootTile.root.implicitTiling.subtrees.uri;
        } else if (rootTile.root.implicitTiling.subtrees.url) {
            subtreeUriTemplate = rootTile.root.implicitTiling.subtrees.url;
        }
    }

    let contentURITemplates = [];
    if (rootTile.root.content) {
        if (rootTile.root.content.uri) {
            contentURITemplates.push(rootTile.root.content.uri);
        } else if (rootTile.root.content.url) {
            contentURITemplates.push(rootTile.root.content.url);
        }
    } else if (rootTile.root.contents) {
        rootTile.root.contents.forEach(content => {
            if (content.uri) {
                contentURITemplates.push(content.uri);
            } else if (content.url) {
                contentURITemplates.push(content.url);
            }
        })
    }

    const rootURL = getDirectoryUrl(url);

    let subtreeUri;
    if (isQuad) {
        subtreeUri = subtreeUriTemplate
            .replace("{level}", 0)
            .replace("{x}", 0)
            .replace("{y}", 0);
    }
    if (!isQuad) {
        subtreeUri = subtreeUriTemplate
            .replace("{level}", 0)
            .replace("{x}", 0)
            .replace("{y}", 0)
            .replace("{z}", 0);
    }

    const globalAddress = { level: 0, x: 0, y: 0 };
    const localAddress = { level: 0, x: 0, y: 0 };
    if (!isQuad) {
        globalAddress.z = 0;
        localAddress.z = 0;
    }

    subtreeMap.set(subtreeUri, await fetchAndDecodeSubtree(rootURL + subtreeUri))
    const subtree = subtreeMap.get(subtreeUri);
    const contents = [];
    if (subtree.isContentAvailable(localAddress)) {
        contentURITemplates.forEach(contentURI => {
            let uri;
            if (isQuad) {
                uri = contentURI
                    .replace("{level}", globalAddress.level)
                    .replace("{x}", globalAddress.x)
                    .replace("{y}", globalAddress.y);
            }
            if (!isQuad) {
                uri = contentURI
                    .replace("{level}", globalAddress.level)
                    .replace("{x}", globalAddress.x)
                    .replace("{y}", globalAddress.y)
                    .replace("{z}", globalAddress.z);
            }
            contents.push({ uri: uri });
        });
    }
    const explicitTileset = {
        geometricError: rootTile.root.geometricError,
        boundingVolume: rootTile.root.boundingVolume,
        refine: rootTile.root.refine,
        globalAddress: globalAddress,
        localAddress: localAddress,
        subtree: subtree,
        contents: contents,
        getChildren: async () => {
            return buildChildren(explicitTileset)
        }
    }
    return {
        root: explicitTileset

    }


    async function buildChildren(parent) {
        const children = [];
        if (parent.localAddress.level == rootTile.root.implicitTiling.availableLevels - 1) return children;

        if ((parent.localAddress.level + 1) % rootTile.root.implicitTiling.subtreeLevels == 0) { // end of subtree 

            const localAddresses = getChildrenAddresses(parent.localAddress);
            const globalAddresses = getChildrenAddresses(parent.globalAddress);
            const boundingVolumes = computeBoundingVolumes(isQuad, rootTile.root.boundingVolume, globalAddresses);

            for (let i = 0; i < localAddresses.length; i++) {
                const childLocalAddress = localAddresses[i];
                const childGlobalAddress = globalAddresses[i];
                if (parent.subtree.isChildSubtreeAvailable(childLocalAddress)) {
                    let subtreeUri;
                    if (isQuad) {
                        subtreeUri = subtreeUriTemplate
                            .replace("{level}", childGlobalAddress.level)
                            .replace("{x}", childGlobalAddress.x)
                            .replace("{y}", childGlobalAddress.y);
                    }
                    if (!isQuad) {
                        subtreeUri = subtreeUriTemplate
                            .replace("{level}", childGlobalAddress.level)
                            .replace("{x}", childGlobalAddress.x)
                            .replace("{y}", childGlobalAddress.y)
                            .replace("{z}", childGlobalAddress.z);
                    }
                }
                if (!subtreeMap.has(subtreeUri)) {
                    subtreeMap.set(subtreeUri, await fetchAndDecodeSubtree(rootURL + subtreeUri))
                }
                const newSubtree = subtreeMap.get(subtreeUri)
                const newLocalAddress = { level: 0, x: 0, y: 0 };
                if (!isQuad) newLocalAddress.z = 0;

                const contents = [];
                if (newSubtree.isContentAvailable(newLocalAddress)) {
                    contentURITemplates.forEach(contentURI => {
                        let uri;
                        if (isQuad) {
                            uri = contentURI
                                .replace("{level}", childGlobalAddress.level)
                                .replace("{x}", childGlobalAddress.x)
                                .replace("{y}", childGlobalAddress.y);
                        }
                        if (!isQuad) {
                            //let rootZ = Math.floor(z / factor);
                            uri = contentURI
                                .replace("{level}", childGlobalAddress.level)
                                .replace("{x}", childGlobalAddress.x)
                                .replace("{y}", childGlobalAddress.y)
                                .replace("{z}", childGlobalAddress.z);
                        }
                        contents.push({ uri: uri });
                    });
                }
                const child = {
                    geometricError: parent.geometricError / 2,
                    boundingVolume: boundingVolumes[i],
                    refine: rootTile.root.refine,
                    globalAddress: childGlobalAddress,
                    localAddress: newLocalAddress,
                    subtree: newSubtree,
                    contents: contents,
                    getChildren: async () => {
                        return buildChildren(child);
                    }
                }
                children.push(child);
            }
        } else { // not the end of the subtree
            const localAddresses = getChildrenAddresses(parent.localAddress);
            const globalAddresses = getChildrenAddresses(parent.globalAddress);
            const boundingVolumes = computeBoundingVolumes(isQuad, rootTile.root.boundingVolume, globalAddresses);

            for (let i = 0; i < localAddresses.length; i++) {
                const childLocalAddress = localAddresses[i];
                const childGlobalAddress = globalAddresses[i];
                if (!parent.subtree.isTileAvailable(childLocalAddress)) {
                    continue;
                }
                const contents = [];
                const contentAvailability = parent.subtree.isContentAvailable(childLocalAddress);
                for (let i = 0; i < contentURITemplates.length; i++) {
                    if (!contentAvailability[i]) continue;
                    const contentURITemplate = contentURITemplates[i];
                    let uri;
                    if (isQuad) {
                        uri = contentURITemplate
                            .replace("{level}", childGlobalAddress.level)
                            .replace("{x}", childGlobalAddress.x)
                            .replace("{y}", childGlobalAddress.y);
                    }
                    if (!isQuad) {
                        uri = contentURITemplate
                            .replace("{level}", childGlobalAddress.level)
                            .replace("{x}", childGlobalAddress.x)
                            .replace("{y}", childGlobalAddress.y)
                            .replace("{z}", childGlobalAddress.z);
                    }
                    contents.push({ uri: uri });
                }


                const child = {
                    geometricError: parent.geometricError / 2,
                    boundingVolume: boundingVolumes[i],
                    refine: rootTile.root.refine,
                    globalAddress: childGlobalAddress,
                    localAddress: childLocalAddress,
                    subtree: parent.subtree,
                    contents: contents,
                    getChildren: async () => {
                        return buildChildren(child);
                    }
                }
                children.push(child)
            }
        }

        return children.length>0?children:undefined;
    }

}

function getChildrenAddresses(tileAddress) {
    const { level, x, y, z } = tileAddress;
    const nextLevel = level + 1;
    let children = [];

    if (z === undefined) {
        // Quadtree
        children = [
            { level: nextLevel, x: x * 2, y: y * 2 }, // Bottom left
            { level: nextLevel, x: x * 2 + 1, y: y * 2 }, // Bottom right
            { level: nextLevel, x: x * 2, y: y * 2 + 1 }, // Top left
            { level: nextLevel, x: x * 2 + 1, y: y * 2 + 1 }  // Top right
        ];
    } else {
        // Octree
        children = [
            { level: nextLevel, x: x * 2, y: y * 2, z: z * 2 },     // Bottom front left
            { level: nextLevel, x: x * 2 + 1, y: y * 2, z: z * 2 },     // Bottom front right
            { level: nextLevel, x: x * 2, y: y * 2 + 1, z: z * 2 },     // Bottom back left
            { level: nextLevel, x: x * 2 + 1, y: y * 2 + 1, z: z * 2 },     // Bottom back right
            { level: nextLevel, x: x * 2, y: y * 2, z: z * 2 + 1 }, // Top front left
            { level: nextLevel, x: x * 2 + 1, y: y * 2, z: z * 2 + 1 }, // Top front right
            { level: nextLevel, x: x * 2, y: y * 2 + 1, z: z * 2 + 1 }, // Top back left
            { level: nextLevel, x: x * 2 + 1, y: y * 2 + 1, z: z * 2 + 1 }  // Top back right
        ];
    }

    return children;
}

function getDirectoryUrl(url) {
    const cleanUrl = url.split('?')[0]; // Removes query parameters
    return cleanUrl.substring(0, cleanUrl.lastIndexOf('/') + 1);
};

function computeBoundingVolumes(isQuad, rootBoundingVolume, addresses) {
    const boundingVolumes = [];
    for (let i = 0; i < addresses.length; i++) {
        boundingVolumes.push(computeBoundingVolume(isQuad, rootBoundingVolume, addresses[i]))
    }
    return boundingVolumes;
}

function computeBoundingVolume(isQuad, rootBoundingVolume, address) {
    if (rootBoundingVolume.region) {
        return splitRegion(isQuad, rootBoundingVolume.region, address);
    } else if (rootBoundingVolume.box) {
        return splitBox(isQuad, rootBoundingVolume.box, address);
    } else {
        throw new Error('Unsupported bounding volume type');
    }
}

function splitRegion(isQuad, rootRegion, address) {
    // Destructure the rootRegion for clarity
    const [west, south, east, north, minHeight, maxHeight] = rootRegion;
  
    // Calculate the size of each division step based on the tile's level
    const xStep = (east - west) / (2 ** address.level);
    const yStep = (north - south) / (2 ** address.level);
    const zStep = isQuad ? 0 : (maxHeight - minHeight) / (2 ** address.level);
  
    // Calculate the new bounds for the tile
    const newWest = west + (xStep * address.x);
    const newSouth = south + (yStep * address.y);
    const newEast = newWest + xStep;
    const newNorth = newSouth + yStep;
    
    // For quadtrees, the z dimension remains unchanged. For octrees, calculate new heights.
    const newMinHeight = isQuad ? minHeight : minHeight + (zStep * address.z);
    const newMaxHeight = isQuad ? maxHeight : newMinHeight + zStep;
  
    return {region:[newWest, newSouth, newEast, newNorth, newMinHeight, newMaxHeight]};
  }

  function splitBox(isQuad, box, address) {
    // Extract center and half-length vectors from the box
    const center = box.slice(0, 3);
    const vectors = [
      box.slice(3, 6),  // First half-length vector
      box.slice(6, 9),  // Second half-length vector
      box.slice(9, 12)  // Third half-length vector
    ];
  
    // Determine scale factors for each axis
    const s = 1/Math.pow(2,address.level);
    const scaleFactors = [s, s, isQuad ? 1 : s];
  
    // Adjust the half-length vectors according to the scale factor
    const newVectors = vectors.map((vector, index) => vector.map(component => component * scaleFactors[index]));
  
    const origin = [center[0]-vectors[0][0]-vectors[1][0]-vectors[2][0], center[1]-vectors[0][1]-vectors[1][1]-vectors[2][1], center[2]-vectors[0][2]-vectors[1][2]-vectors[2][2]]
    // Calculate new center based on the child address
    const newCenter = [
        origin[0] + (address.x*2+1)*(newVectors[0][0]+newVectors[1][0]+newVectors[2][0]),
        origin[1] + (address.y*2+1)*(newVectors[0][1]+newVectors[1][1]+newVectors[2][1]),
        isQuad?center[2]:origin[2] + (address.z*2+1)*(newVectors[0][2]+newVectors[1][2]+newVectors[2][2]),
    ];
  
    // Construct the new box with the updated center and scaled half-length vectors
    const newBox = newCenter.concat(...newVectors);
  
    return {box:newBox};
  }
  


export {
    resolveImplicite
}
