/**
 * A Batched mesh extension that automatically atlasses textures 
 * allowing any number of meshes to be rendered in a single draw call.
 */

import * as THREE from 'three';
import {
    MinPriorityQueue
} from 'data-structure-typed';

class OneMesh {
    /**
     * 
     * @param {Object} [properties] - all the properties
     * @param {number} [properties.atlasSize = 4096] - atlas page size
     * @param {number} [properties.tileSize = 64] - texture tile size
     * @param {number} [properties.margin = 1] - margin between tiles. mip map levels will be limited accordingly
     * @param {number} [properties.meshAttributeSegmentSize = 2048] - mesh attributes will be segmented in slots of the given size avoiding fragmentation but wasting memory when slots aren't filled completely.
     */
    constructor(properties) {
        this.atlasSize = properties.atlasSize || 4096;
        this.tileSize = properties.tileSize || 64;
        this.margin = properties.margin || 1;
        this.meshAttributeSegmentSize = properties.meshAttributeSegmentSize || 2048;
        this.indicesBufferSize = this.meshAttributeSegmentSize * 10 + 1;
        this.attributeBuffersSize = this.meshAttributeSegmentSize * 10 + 1;
        
        // init geometry
        this.rebuildGeometry();
    }


    /**
     * 
     * @param {THREE.Mesh} aMesh a mesh to add
     */
    addMesh(aMesh) {
        const newIndices = aMesh.geometry.index;

        const newPositions = aMesh.geometry.attributes.position;
        const newColor = aMesh.geometry.attributes.color;
        const newUvs = aMesh.geometry.attributes.uvs;


        const attributeSlotsNeeded = Math.ceil(newPositions.count / this.meshAttributeSegmentSize);
        const indicesSlotsNeeded = !!newIndices ? Math.ceil(newIndices.count / this.meshAttributeSegmentSize) : attributeSlotsNeeded;

        let shouldRebuild = false;
        if (indicesSlotsNeeded > this.indicesFreeAddresses.length) {
            this.indicesBufferSize = Math.max(this.indicesBufferSize * 2, this.indicesBufferSize + (indicesSlotsNeeded - this.indicesFreeAddresses.length) * this.meshAttributeSegmentSize)
            shouldRebuild = true;
        }

        if (indicesSlotsNeeded > this.attributesFreeAddresses.length) {
            this.attributeBuffersSize = Math.max(this.attributeBuffersSize * 2, this.attributeBuffersSize + (attributeSlotsNeeded - this.attributesFreeAddresses.length) * this.meshAttributeSegmentSize)
            shouldRebuild = true;
        }

        if (shouldRebuild) this.rebuildGeometry();

        
        //TODO Get free slots, copy parameters and copy indices with offsets

        //TODO textures

    }
    removeMesh(aMesh) {

    }

    rebuildGeometry() {
        if (!this.indices) {
            this.indices = new Uint32Array(this.indicesBufferSize);
            this.indicesFreeAddresses = new MinPriorityQueue();
            for (let i = 1; i < this.indicesBufferSize; i += this.meshAttributeSegmentSize) {
                this.indicesFreeAddresses.add(i);
            }
        }
        else if (this.indicesBufferSize > this.indices.length) {
            const newIndices = new Uint32Array(this.indicesBufferSize);
            newIndices.set(this.indices);
            for (let i = this.indices.length; i < this.indicesBufferSize; i += this.meshAttributeSegmentSize) {
                this.indicesFreeAddresses.add(i);
            }
            this.indices = newIndices;
        } else if (this.indicesBufferSize < this.indices.length) {
            this.indices = this.indices.slice(0, this.indicesBufferSize)
            this.indicesFreeAddresses = this.indicesFreeAddresses.filter((e) => { return e < this.indicesBufferSize });
        }

        if (!this.positions || !this.color || this.uvs) {
            this.positions = new Float32Array(this.attributeBuffersSize * 3);
            this.color = new Uint8Array(this.attributeBuffersSize * 3);
            this.uvs = new Float32Array(this.attributeBuffersSize * 2);
            this.attributesFreeAddresses = new MinPriorityQueue();
            for (let i = 1; i < this.attributeBuffersSize; i += this.meshAttributeSegmentSize) {
                this.attributesFreeAddresses.add(i);
            }
        }
        else if (this.attributeBuffersSize * 3 > this.positions.length) {
            const newPositions = new Float32Array(this.attributeBuffersSize * 3);
            const newColor = new Uint8Array(this.attributeBuffersSize * 3);
            const newUvs = new Float32Array(this.attributeBuffersSize * 2);
            newPositions.set(this.positions);
            newColor.set(this.color);
            newUvs.set(this.uvs);
            for (let i = this.positions.length / 3; i < this.attributeBuffersSize; i += this.meshAttributeSegmentSize) {
                this.attributesFreeAddresses.add(i);
            }
            this.positions = newPositions;
            this.color = newColor;
            this.uvs = newUvs;
        } else if (this.attributeBuffersSize * 3 < this.positions.length) {
            this.positions = this.positions.slice(0, this.attributeBuffersSize * 3)
            this.color = this.color.slice(0, this.attributeBuffersSize * 3)
            this.uvs = this.uvs.slice(0, this.attributeBuffersSize * 2)
            this.attributesFreeAddresses = this.attributesFreeAddresses.filter((e) => { return e < this.attributeBuffersSize });
        }

        

        if (this.geometry) {
            this.geometry.dispose();
        }
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setIndex(this.indices);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('uvs', new THREE.BufferAttribute(this.uvs, 2));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.color, 3, true));

    }
}

