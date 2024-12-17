import * as THREE from 'three';
import { v4 as uuidv4 } from "uuid";

const workers = [];
let workerCounter = 0;
class SplatsDecoder {

	constructor(gltfLoader, renderer) {
		const self = this;
		self.renderer = renderer;
		self.gltfLoader = gltfLoader;
	}

	parseSplats(arrayBuffer, sceneZupToYUp, meshZUpToYUp, splatsMesh) {
		const self = this;
		return new Promise(async (resolve, reject) => {
			await self.checkLoaderInitialized();
			self.gltfLoader.parse(arrayBuffer, null, model => {
				const scene = model.scene;
				const decoded = model.scene.children[0];
				const positions = decoded.geometry.attributes.position;
				const colors = decoded.geometry.attributes.color;
				const cov0 = decoded.geometry.attributes.cov_0;
				const cov1 = decoded.geometry.attributes.cov_1;
				const splatTile = splatsMesh.addSplatsTile(positions, colors, cov0, cov1);
				model.scene.traverse(o=>{
					if(o.dispose) o.dispose();
				})
				resolve(splatTile);
				
			}, error => {
				console.error(error);
			});
		});
	}

	checkLoaderInitialized = async () => {
		const self = this;
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if ((!self.gltfLoader.hasDracoLoader || self.gltfLoader.dracoLoader) && (!self.gltfLoader.hasKTX2Loader || self.gltfLoader.ktx2Loader)) {
					clearInterval(interval);
					resolve();
				}
			}, 10); 
		});
	};
} export { SplatsDecoder };

