build:
	make ts && \
	rollup main.js -o main.bundle.js -f cjs -e http,querystring,path,util,net,fs,os,process && \
	node main.bundle.js

ts:
	tsc -m es6 -t ES2019 -moduleResolution node main.ts
