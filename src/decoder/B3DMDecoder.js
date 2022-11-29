import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
gltfLoader.setDRACOLoader(dracoLoader);
const dummy = new THREE.Object3D();
//const legacyGLTFLoader = new LegacyGLTFLoader();

function parseB3DM(arrayBuffer, meshCallback) {
	const dataView = new DataView(arrayBuffer);

	const magic =
		String.fromCharCode(dataView.getUint8(0)) +
		String.fromCharCode(dataView.getUint8(1)) +
		String.fromCharCode(dataView.getUint8(2)) +
		String.fromCharCode(dataView.getUint8(3));
	console.assert(magic === 'b3dm');

	const version = dataView.getUint32(4, true);
	console.assert(version === 1);

	const byteLength = dataView.getUint32(8, true);
	console.assert(byteLength === arrayBuffer.byteLength);

	const featureTableJSONByteLength = dataView.getUint32(12, true);
	const featureTableBinaryByteLength = dataView.getUint32(16, true);
	const batchTableJSONByteLength = dataView.getUint32(20, true);
	const batchTableBinaryByteLength = dataView.getUint32(24, true);

	const featureTableStart = 28;
	//const featureTable = new FeatureTable( arrayBuffer, featureTableStart, featureTableJSONByteLength, featureTableBinaryByteLength );

	const batchTableStart = featureTableStart + featureTableJSONByteLength + featureTableBinaryByteLength;
	//const batchTable = new BatchTable( arrayBuffer, featureTable.getData( 'BATCH_LENGTH' ), batchTableStart, batchTableJSONByteLength, batchTableBinaryByteLength );

	const glbStart = batchTableStart + batchTableJSONByteLength + batchTableBinaryByteLength;
	const glbBytes = new Uint8Array(arrayBuffer, glbStart, byteLength - glbStart);


	const gltfBuffer = glbBytes.slice().buffer;


	return new Promise((resolve, reject) => {

		gltfLoader.parse(gltfBuffer, null, model => {

			////TODO
			//model.batchTable = b3dm.batchTable;
			//model.featureTable = b3dm.featureTable;

			//model.scene.batchTable = b3dm.batchTable;
			//model.scene.featureTable = b3dm.featureTable;

			//const scene = mergeColoredObject(model.scene);
			model.scene.traverse((o) => {
				if (o.isMesh) {
					if (!!meshCallback) {
						meshCallback(o);
					}

				}
			});
			resolve(model.scene);
		}, error => {
			console.error(error);
		});
	});
}

const B3DMDecoder = {
	parseB3DM: parseB3DM,
	parseB3DMInstanced: (arrayBuffer, meshCallback, maxCount) => { // expects GLTF with one node level

		return parseB3DM(arrayBuffer, meshCallback).then(mesh => {
			let instancedMesh;
			mesh.traverse(child => {
				if (child.isMesh) {
					instancedMesh = new THREE.InstancedMesh(child.geometry, child.material, maxCount);
					instancedMesh.baseMatrix = child.matrix;
					//console.log(child.matrix.elements[12])
				}
			});
			return instancedMesh;
		});

	}
}

/**
 * //TODO find something else than this workaround
 * 
 * Because B3DM doesn't support colored faces, they are usually encoded as separate meshes each one with a global color.
 * However, when a mesh has many different face colors, this becomes very inneficient.
 * This method doesn't fix the slow decoding of the GLTFLoader but at least merges meshes together and transfers the face color to vertex color 
 * which is much more efficient at render time. 
 * Textured meshes with the same texture are also merged and color is discarded
 * 
 * Big assumption! all the meshes are assumed to have the same transformation matrix
 * 
 * @param {*} scene 
 * @returns 
 */
/*function mergeColoredObject(scene) {
	
	const coloredMeshes = {};
	const texturedMeshes = {};
	scene.traverse((element) => {
		if (element.isMesh) {
			if (element.material) {
				// dispose materials
				if (element.material.length) {
					// not supported
				}
				else {
					if (!element.material.map) {
						let color = element.material.color;
						color = "rgb("+Math.floor(color.r*255)+","+Math.floor(color.g*255)+","+Math.floor(color.b*255)+")";
						if (!coloredMeshes[color]) {
							coloredMeshes[color] = [];
						}
						coloredMeshes[color].push(element);
					} else {
						if (!texturedMeshes[element.material.map]) {
							texturedMeshes[element.material.map] = [];
						}
						texturedMeshes[element.material.map].push(element);
					}
				}
			}
		}
	});

	let coloredMeshMaterial;
	const fullColoredGeometriesToMerge = [];
	for (const color in coloredMeshes) {
		if (coloredMeshes.hasOwnProperty(color)) {
			const threeColor = new Color(color);
			//const geometriesToMerge = [];
			coloredMeshes[color].forEach(mesh => {
				if(!coloredMeshMaterial){
					coloredMeshMaterial = mesh.material.clone();
					delete coloredMeshMaterial.color;
					coloredMeshMaterial.vertexColors = true;
				}
				const colors = [];
			for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
				colors.push(threeColor.r);
				colors.push(threeColor.g);
				colors.push(threeColor.b);
			}
			mesh.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

			fullColoredGeometriesToMerge.push(mesh.geometry);
			});
			
		}
	}

	let mergedColoredMesh;
	if(fullColoredGeometriesToMerge.length>0){
		let mergedColoredGeometry = BufferGeometryUtils.mergeBufferGeometries(fullColoredGeometriesToMerge, false);
		mergedColoredMesh = new Mesh(mergedColoredGeometry, coloredMeshMaterial);
		//mergedColoredMesh.matrix = matrix;
		for (const color in coloredMeshes) {
			if (coloredMeshes.hasOwnProperty(color)) {
				coloredMeshes[color].forEach(mesh => {
					mesh.material.dispose();
					mesh.geometry.dispose();
				});
			}
		}
	}
	

	const mergedTexturedMeshes = [];
	for(const map in texturedMeshes){
		if (texturedMeshes.hasOwnProperty(map)) {
			if(texturedMeshes[map].length==1){
				mergedTexturedMeshes.push(texturedMeshes[map][0]);
				continue;
			}
			const geometries = [];
			let material;
			texturedMeshes[map].forEach(mesh => {
				if(!material){
					material = mesh.material.clone();
					delete material.color;
					material.vertexColors = false;
				}
				geometries.push(mesh.geometry);
			});
			
			const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
			const mesh = new Mesh(mergedGeometry, material);
			//mesh.matrix = matrix;
			mergedTexturedMeshes.push(mesh);
			texturedMeshes[map].forEach(mesh => {
				mesh.material.dispose();
				mesh.geometry.dispose();
			});
		}
	}

	scene.clear();
	if(!!mergedColoredMesh) scene.add(mergedColoredMesh);
	mergedTexturedMeshes.forEach(mesh=>scene.add(mesh));
	console.log();
	scene.matrix = new THREE.Matrix4();
	return scene;
}*/

export { B3DMDecoder }

