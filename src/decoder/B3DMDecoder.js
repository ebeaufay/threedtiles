import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import * as THREE from 'three';
import { FeatureTable, BatchTable } from './FeatureTable';

const zUpToYUpMatrix = new THREE.Matrix4();
zUpToYUpMatrix.set(
	1, 0, 0, 0,
	0, 0, -1, 0,
	0, 1, 0, 0,
	0, 0, 0, 1);

const onlineDracoPath = 'https://www.gstatic.com/draco/versioned/decoders/1.4.3/';
const onlineKTX2Path = 'https://storage.googleapis.com/ogc-3d-tiles/basis/';
const localDracoPath = 'draco-decoders/';
const localKTX2Path = 'ktx2-decoders/';
export class B3DMDecoder {
	constructor(renderer) {
		
		this.gltfLoader = new GLTFLoader();
		this.tempMatrix = new THREE.Matrix4();

		const dracoLoader = new DRACOLoader();
		const ktx2Loader = new KTX2Loader();
		checkResource(localDracoPath+"draco_decoder.wasm").then(result=>{
			if(result){
				dracoLoader.setDecoderPath(localDracoPath);
			}else{
				console.log("no local draco decoder found in "+localDracoPath+", fetching online at "+onlineDracoPath);
				dracoLoader.setDecoderPath(onlineDracoPath);
			}
			return checkResource(localKTX2Path+"basis_transcoder.wasm");
		}).then(result=>{
			if(result){
				ktx2Loader.setTranscoderPath(localKTX2Path).detectSupport(renderer);
			}else{
				console.log("no local ktx2 decoder found in "+localKTX2Path+", fetching online at "+onlineKTX2Path);
				ktx2Loader.setTranscoderPath(onlineKTX2Path).detectSupport(renderer);
			}
		}).then(()=>{
			this.gltfLoader.setDRACOLoader(dracoLoader);
			this.gltfLoader.setKTX2Loader(ktx2Loader);
		});

		async function checkResource(url) {
			return fetch(url, { method: 'HEAD' }).then(response=>{
				return response.ok;
			}).catch(e=>{
				return false;
			});
		}
		
	}

	parseB3DM(arrayBuffer, meshCallback, sceneZupToYUp, meshZUpToYUp) {
		const dataView = new DataView(arrayBuffer);

		const magic =
			String.fromCharCode(dataView.getUint8(0)) +
			String.fromCharCode(dataView.getUint8(1)) +
			String.fromCharCode(dataView.getUint8(2)) +
			String.fromCharCode(dataView.getUint8(3));
		console.assert(magic === 'b3dm');

		const byteLength = dataView.getUint32(8, true);
		console.assert(byteLength === arrayBuffer.byteLength);

		const featureTableJSONByteLength = dataView.getUint32(12, true);
		const featureTableBinaryByteLength = dataView.getUint32(16, true);
		const batchTableJSONByteLength = dataView.getUint32(20, true);
		const batchTableBinaryByteLength = dataView.getUint32(24, true);

		const featureTableStart = 28;
		const featureTable = new FeatureTable(arrayBuffer, featureTableStart, featureTableJSONByteLength, featureTableBinaryByteLength);

		const batchTableStart = featureTableStart + featureTableJSONByteLength + featureTableBinaryByteLength;
		const batchTable = new BatchTable(arrayBuffer, featureTable.getData('BATCH_LENGTH'), batchTableStart, batchTableJSONByteLength, batchTableBinaryByteLength);

		const glbStart = batchTableStart + batchTableJSONByteLength + batchTableBinaryByteLength;
		const glbBytes = new Uint8Array(arrayBuffer, glbStart, byteLength - glbStart);


		const gltfBuffer = glbBytes.slice().buffer;


		return new Promise((resolve, reject) => {

			this.gltfLoader.parse(gltfBuffer, null, model => {

				////TODO

				//model.batchTable = b3dm.batchTable;
				//model.featureTable = b3dm.featureTable;

				//model.scene.batchTable = b3dm.batchTable;
				//model.scene.featureTable = b3dm.featureTable;

				//const scene = mergeColoredObject(model.scene);

				//model.scene.applyMatrix4(ytozUpMatrix);

				const rtcCenter = featureTable.getData('RTC_CENTER');
				if (rtcCenter) {
					this.tempMatrix.makeTranslation(rtcCenter[0], rtcCenter[1], rtcCenter[2])
					model.scene.applyMatrix4(this.tempMatrix);
				} else if (!!model.userData.gltfExtensions && !!model.userData.gltfExtensions.CESIUM_RTC) {
					this.tempMatrix.makeTranslation(model.userData.gltfExtensions.CESIUM_RTC.center[0], model.userData.gltfExtensions.CESIUM_RTC.center[1], model.userData.gltfExtensions.CESIUM_RTC.center[2])
					model.scene.applyMatrix4(this.tempMatrix);
				}

				if (sceneZupToYUp) {
					model.scene.applyMatrix4(zUpToYUpMatrix);
				} 
				model.scene.asset = model.asset;
				model.scene.traverse((o) => {

					if (o.isMesh) {
						if (meshZUpToYUp) {
							o.applyMatrix4(zUpToYUpMatrix);
						}
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

	parseB3DMInstanced(arrayBuffer, meshCallback, maxCount, sceneZupToYUp, meshZupToYup) { // expects GLTF with one node level

		return this.parseB3DM(arrayBuffer, meshCallback, sceneZupToYUp, meshZupToYup).then(mesh => {
			// todo several meshes in a single gltf
			let instancedMesh;
			mesh.updateWorldMatrix(false, true)
			mesh.traverse(child => {
				if (child.isMesh) {
					instancedMesh = new THREE.InstancedMesh(child.geometry, child.material, maxCount);
					instancedMesh.baseMatrix = child.matrixWorld;
				}
			});
			return instancedMesh;
		});

	}
}