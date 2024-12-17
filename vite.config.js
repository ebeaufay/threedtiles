// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
// If you installed any Vite plugins, import them here
// Example: import glsl from 'vite-plugin-glsl';

export default defineConfig({
  // Define the root directory (default is the current working directory)
  root: process.cwd(),

  // Base public path when served in development or production
  base: './',

  worker: {
    format: 'es',
  },
  
  // Define plugins if any
  plugins: [
    // Example: glsl(), // If using GLSL shaders
  ],

  // Configure the development server
  server: {
    port: 3000,       // Change the port if needed
    open: true,       // Automatically open the app in the browser
    // proxy: { ... }, // Set up proxy if you're making API calls
  },

  // Define build options
  build: {
    outDir: 'dist',            // Output directory
    target: 'esnext',          // JavaScript language target
    sourcemap: true,           // Generate source maps
    minify: 'esbuild',         // Minifier to use ('esbuild', 'terser', or false)
    emptyOutDir: true,         // Empty the output directory before building
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'), // Entry point
      // You can customize Rollup options here
    },
  },

  // Resolve module aliases
  resolve: {
    alias: {
      //'@': path.resolve(__dirname, './src'), // Allows using '@' to reference 'src' directory
      // Add more aliases if needed
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['three'], // Pre-bundle Three.js for faster dev server start
    // exclude: [],     // Exclude dependencies if necessary
  },

  // Define how assets are handled
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr'], // Include 3D model formats
});