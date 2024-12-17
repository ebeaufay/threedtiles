# ULTRA\_splats

## Contributors 

* Emeric Beaufays, JDULTRA

## Status

Draft

## Dependencies

Written against the glTF 2.0 spec.

## Overview

This extension describes a way to encode gaussian splats in gltf.

Gaussian Splats attributes (position, covariance, opacity and spherical harmonics) are encoded in regular glTF2 accessors.

This allows for minimal footprint and compression when combined with extensions such as KHR_mesh_quantization, KHR_draco_mesh_compression or EXT_meshopt_compression.

```
{
  "extensionsUsed": ["ULTRA_splats"],
  "extensionsRequired": [],
  "meshes": [
    {
      "primitives": [
        {
          "attributes": {
            "POSITION": 0,
            "COLOR_0": 1,
            "COLOR_1": 2,
            // ... up to COLOR_15 ...
            "COLOR_15": 16,
            "COV_0": 17,
            "COV_1": 18
          },
          "indices": 19,
          "mode": 0,
          "extensions": {
            "ULTRA_splats": {
              "harmonicLevels": 3
            }
          }
        }
      ]
    }
  ],
  "accessors": [
    {
      "bufferView": 0,
      "componentType": 5126,
      "count": ...,
      "type": "VEC3",
      "name": "POSITION"
    },
    {
      "bufferView": 1,
      "componentType": 5126,
      "count": ...,
      "type": "VEC4",
      "name": "COLOR_0"
    },
    {
      "bufferView": 2,
      "componentType": 5126,
      "count": ...,
      "type": "VEC3",
      "name": "COLOR_1"
    },
    // ... COLOR_2 to COLOR_15 same as COLOR_1 ...
    {
      "bufferView": 17,
      "componentType": 5126,
      "count": ...,
      "type": "VEC3",
      "name": "COV_0"
    },
    {
      "bufferView": 18,
      "componentType": 5126,
      "count": ...,
      "type": "VEC3",
      "name": "COV_1"
    },
  ]
}

```

### Position

The Mesh Primitive Attribute POSITION is used to represent the gaussian splat's center. When using a mesh primitive mode 0 (POINTS), the splats can be visualized as a point-cloud making the extension not strictly required.

### Opacity and spherical harmonics

The Mesh Primitive Attribute COLOR_0 (vec4) is used to encode the level 0 spherical harmonic coefficients and opacity.
This allows a viewer that doesn't support the extension to still visualize the splats as a colored point-cloud when using primitive mode 0.
The COLOR_0 attribute is required.

Attributes COLOR_1 to COLOR_15 (vec3) are used to encode higher order spherical harmonics. 
These are optional. The harmonicLevels property of the extension indicates what values are available:

COLOR_1 to COLOR_3 for level 1.
COLOR_4 to COLOR_8 for level 2.
COLOR_9 to COLOR_15 for level 3.

Opacity and spherical harmonics coefficients are expected to be linear.

### Covariance

The covariance matrix is always expected to be symmetrical. therefor, only six values are needed.

for a covariance matrix:

```
[
    a,b,c,
    b,d,e,
    c,e,f
]
```

The covariance is encoded in 2 vec3 attributes COV_0 and COV_1 where COV_0 takes the values a,b,c and COV_1 takes the values d,e,f

## glTF Schema Updates

* **JSON schema**: [glTF.ULTRA_splats.schema.json](schema/glTF.ULTRA_splats.schema.json)

## Notes on compression

while spherical harmonics and opacity compress well, covariance and position require more precision.
positions and covariances tend to vary over very large scales because gaussian splats are very detailed near the original camera positions or when they're covered by many camera angles but further away splats tend to be very large and spaced out.

When using quantize/draco/meshopt compression, it's reccomended to use: 

8 bits or more for color quantization
20 bits or more for position quantization
24 bits or more for generic attributes (COV_0 and COV_2)

These number of bits for color(harmonics) and covariance quantization can be reduced when the splats are cropped to the high detail zone of the splats scene.

### Draco compression
The KHR_draco_mesh_compression extension only suports primitive mode 4 (Triangle). When using this mode, it's recommended to set the ULTRA_splats extension as "required" as viewers that don't implement this extension will automatically try to render the splats as a triangle mesh. 

