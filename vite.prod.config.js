// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  // Define the build configuration
  build: {
    // Specify library mode
    lib: {
      // Entry point of your library
      entry: path.resolve(__dirname, 'src/entry.js'), // or 'src/entry.ts' if using TypeScript

      // Name of the library (used in UMD/IIFE builds)
      name: 'threedtiles',

      // File name for the output (without extension)
      fileName: (format) => `threedtiles.${format}.js`,
      
      // Formats to build
      formats: ['es', 'cjs', 'umd'], // Adjust based on your needs
    },
    
    // Output directory
    outDir: 'dist',
    
    // Rollup options
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: ['three'],

      output: {
        // Provide global variables for external dependencies in UMD/IIFE builds
        globals: {
          three: 'THREE',
        },
      },
    },
    
    // Ensure that sourcemaps are generated
    sourcemap: true,

    
  },

  // Resolve module aliases (optional)
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
  ],
});
