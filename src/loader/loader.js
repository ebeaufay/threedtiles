import { Tile } from "../tile/tile";
import { OBB } from "../geometry/obb";
import { Box3, Vector3, DoubleSide } from "three";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const path = require('path');

const gltfLoader = new GLTFLoader( );

function Loader(meshCallback){
	var self = this;
	this.meshCallback = meshCallback;

	function load(url, signal){
		if(!url.endsWith("b3dm") && !url.endsWith("json")){
			throw new Error("unsupported format : " + url)
		}
		
		return fetch(url, !!signal?{signal: signal}:{}).then(result =>{
			if ( ! result.ok ) {
				throw new Error( `couldn't load "${ url }". Request failed with status ${ result.status } : ${ result.statusText }` );
			}
			if(url.endsWith("b3dm")){
				return result.arrayBuffer().then(buffer=>parseB3DM(buffer, url)).catch(error=>console.log(error));
			}else if(url.endsWith("json")){
				return result.json().then(function(json){
					
					return parseTileset(json.root, path.dirname(url));
				})
			}
		}).catch(error=>{
			return Promise.reject(error);
		});
	}
	
	function parseTileset(tileset, rootPath){
		var tile = new Tile(load);
		console.assert(tileset.geometricError !== 'undefined');
		tile.setGeometricError(tileset.geometricError);
		if(!!tileset.content){
			if(!!tileset.content.uri){
				if(path.isAbsolute(tileset.content.uri)){
					tile.setContent(tileset.content.uri);
				}else{
					tile.setContent(rootPath +path.sep+ tileset.content.uri)
				}
			}else if(!!tileset.content.url){
				if(path.isAbsolute(tileset.content.url)){
					tile.setContent(tileset.content.url);
				}else{
					tile.setContent(rootPath+path.sep+ tileset.content.url)
				}
			}
		}
		
		
		console.assert( !!tileset.boundingVolume );
		if(!!tileset.boundingVolume.box){
			tile.setVolume(new OBB(tileset.boundingVolume.box), "box");
		}else if(!!tileset.boundingVolume.region){
			let region = tileset.boundingVolume.region;
			tile.setVolume(new Box3(new Vector3(region[0], region[2], region[4]), new Vector3(region[1], region[3], region[5])), "region");
		}else if(!!tileset.boundingVolume.sphere){
			let sphere = tileset.boundingVolume.sphere;
			tile.setVolume(new Box3(new Vector3(sphere[0], sphere[1], sphere[2]), sphere[3]), "sphere");
		}
	
		tile.setRefine(!!tileset.refine ? tileset.refine : "REPLACE");
	
		if(!!tileset.children){
			tileset.children.forEach(element => {
				tile.addChild(parseTileset(element, rootPath));
			});
		}
	
	
		return tile;
	}
	
	function parseB3DM(arrayBuffer, url){
			const dataView = new DataView( arrayBuffer );
	
			const magic =
				String.fromCharCode( dataView.getUint8( 0 ) ) +
				String.fromCharCode( dataView.getUint8( 1 ) ) +
				String.fromCharCode( dataView.getUint8( 2 ) ) +
				String.fromCharCode( dataView.getUint8( 3 ) );
			console.assert( magic === 'b3dm' );
	
			const version = dataView.getUint32( 4, true );
			console.assert( version === 1 );
	
			
			const byteLength = dataView.getUint32( 8, true );
			console.assert( byteLength === arrayBuffer.byteLength );
	
			
			const featureTableJSONByteLength = dataView.getUint32( 12, true );
			const featureTableBinaryByteLength = dataView.getUint32( 16, true );
			const batchTableJSONByteLength = dataView.getUint32( 20, true );
			const batchTableBinaryByteLength = dataView.getUint32( 24, true );
	
			const featureTableStart = 28;
			//const featureTable = new FeatureTable( arrayBuffer, featureTableStart, featureTableJSONByteLength, featureTableBinaryByteLength );
	
			const batchTableStart = featureTableStart + featureTableJSONByteLength + featureTableBinaryByteLength;
			//const batchTable = new BatchTable( arrayBuffer, featureTable.getData( 'BATCH_LENGTH' ), batchTableStart, batchTableJSONByteLength, batchTableBinaryByteLength );
	
			const glbStart = batchTableStart + batchTableJSONByteLength + batchTableBinaryByteLength;
			const glbBytes = new Uint8Array( arrayBuffer, glbStart, byteLength - glbStart );
	
	
			const gltfBuffer = glbBytes.slice().buffer;
			
	
			return new Promise( ( resolve, reject ) => {
				
				gltfLoader.parse( gltfBuffer, null, model => {
	
					//model.batchTable = b3dm.batchTable;
					//model.featureTable = b3dm.featureTable;

					//model.scene.batchTable = b3dm.batchTable;
					//model.scene.featureTable = b3dm.featureTable;
					model.scene.traverse((o) => {
						if (o.isMesh) {
							if(!!self.meshCallback){
								self.meshCallback(o);
							}else{
								o.material.side = DoubleSide;
							}
						    
						}
					  });
					resolve( {"model":model, "url":url} );
				}, reject );
			} );
	}
	return{
		"load":load
	}
}

export {Loader};