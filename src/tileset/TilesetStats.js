var TilesetStats = function () {

	
	var beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

	var fps = -1;

	if ( self.performance && self.performance.memory ) {

		var mem = -1;
		var maxMem = -1;

	}


	return {

		begin: function () {

			beginTime = ( performance || Date ).now();

		},

		end: function () {

			frames ++;

			var time = ( performance || Date ).now();

			if ( time >= prevTime + 1000 ) {

				fps = ( frames * 1000 ) / ( time - prevTime );

				prevTime = time;
				frames = 0;

				if ( !!mem ) {

					var memory = performance.memory;
					mem = memory.usedJSHeapSize;
					maxMem = memory.jsHeapSizeLimit;

				}

			}

			return time;

		},

		update: function () {

			beginTime = this.end();

		},

		fps: ()=>fps,
		memory: ()=>mem,
		maxMemory: ()=>maxMem

	};

};

export default TilesetStats;
