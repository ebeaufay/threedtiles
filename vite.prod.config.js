// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import terser from '@rollup/plugin-terser';
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets'
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';


export default defineConfig({
  base: './',
  worker: {
    format: 'es',
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/entry.js'),
      name: 'threedtiles',
      fileName: (format) => `threedtiles.${format}.js`,
      formats: ['es', 'cjs', 'umd'], 
    },
    
    // Output directory
    outDir: 'dist',
    
    rollupOptions: {
      external: ['three'],

      output: {
        globals: {
          three: 'THREE',
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    
    assetsInlineLimit: 0,
    sourcemap: true,

    
  },

  resolve: {
    alias: {
      // Add more aliases if needed
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['three'],
  },
  plugins: [
    wasm(), 
    topLevelAwait(),
    terser({
      maxWorkers: 4
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/three/examples/jsm/libs/draco/**/*',
          dest: 'draco-decoders',
        },
        {
          src: 'node_modules/three/examples/jsm/libs/basis/**/*',
          dest: 'ktx2-decoders',
        },
      ],
    }),
    libAssetsPlugin({
      include: /\.(gltf|glb|hdr|png|jpe?g|svg|gif|ktx2)(\?.*)?$/,
      limit: 1024 * 8
    }),
  ],
  assetsInclude: [
    '**/*.gltf',
    '**/*.glb',
    '**/*.hdr',
    '**/*.bin',
    '**/*.png',
    '**/*.jpe?g',
    '**/*.svg',
    '**/*.gif',
    '**/*.ktx2',
  ],
});
