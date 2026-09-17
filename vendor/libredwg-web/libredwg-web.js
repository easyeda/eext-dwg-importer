/*
 * 本文件由 scripts/sync-vendor.mjs 自动生成，请勿手动修改。
 *
 * 内容 = @mlightcad/libredwg-web 的「wasm 胶水层」+「ESM 包装层」合并而成。
 * 合并原因：上游包装层以相对路径 import 胶水层，而 EDA 弹窗是 blob URL，
 * 不支持相对解析（详见该脚本顶部说明）。合并后本文件无任何相对 import，
 * wasm 二进制在运行时通过 locateFile 指定。
 *
 * 许可：上游为 GPL-3.0，本扩展整体以 GPL-3.0-or-later 分发。
 */

// ===== begin: wasm 胶水层 =====
async function createModule(moduleArg={}){var moduleRtn;var Module=moduleArg;var ENVIRONMENT_IS_WEB=!!globalThis.window;var ENVIRONMENT_IS_WORKER=!!globalThis.WorkerGlobalScope;var ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";if(ENVIRONMENT_IS_NODE){const{createRequire}=await import("node:module");var require=createRequire(import.meta.url)}var programArgs=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var _scriptName=import.meta.url;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_NODE){var fs=require("node:fs");if(_scriptName.startsWith("file:")){scriptDirectory=require("node:path").dirname(require("node:url").fileURLToPath(_scriptName))+"/"}readBinary=filename=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename);return ret};readAsync=async(filename,binary=true)=>{filename=isFileURI(filename)?new URL(filename):filename;var ret=fs.readFileSync(filename,binary?undefined:"utf8");return ret};if(process.argv.length>1){thisProgram=process.argv[1].replace(/\\/g,"/")}programArgs=process.argv.slice(2);quit_=(status,toThrow)=>{process.exitCode=status;throw toThrow}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){try{scriptDirectory=new URL(".",_scriptName).href}catch{}{if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=async url=>{if(isFileURI(url)){return new Promise((resolve,reject)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){resolve(xhr.response);return}reject(xhr.status)};xhr.onerror=reject;xhr.send(null)})}var response=await fetch(url,{credentials:"same-origin"});if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)}}}else{}var out=console.log.bind(console);var err=console.error.bind(console);var wasmBinary;var ABORT=false;var isFileURI=filename=>filename.startsWith("file://");class EmscriptenEH{}class EmscriptenSjLj extends EmscriptenEH{}var readyPromiseResolve,readyPromiseReject;var runtimeInitialized=false;function updateMemoryViews(){var b=wasmMemory.buffer;HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF32=new Float32Array(b);HEAPF64=new Float64Array(b);HEAP64=new BigInt64Array(b);HEAPU64=new BigUint64Array(b)}function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(onPreRuns)}function initRuntime(){runtimeInitialized=true;if(!Module["noFSInit"]&&!FS.initialized)FS.init();TTY.init();wasmExports["__wasm_call_ctors"]();FS.ignorePermissions=false}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(onPostRuns)}function abort(what){Module["onAbort"]?.(what);what=`Aborted(${what})`;err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject?.(e);throw e}var wasmBinaryFile;function findWasmBinary(){if(Module["locateFile"]){return locateFile("libredwg-web.wasm")}return new URL("libredwg-web.wasm",import.meta.url).href}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}async function getWasmBinary(binaryFile){if(!wasmBinary){try{var response=await readAsync(binaryFile);return new Uint8Array(response)}catch{}}return getBinarySync(binaryFile)}async function instantiateArrayBuffer(binaryFile,imports){try{var binary=await getWasmBinary(binaryFile);var instance=await WebAssembly.instantiate(binary,imports);return instance}catch(reason){err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)}}async function instantiateAsync(binary,binaryFile,imports){if(!binary&&!isFileURI(binaryFile)&&!ENVIRONMENT_IS_NODE){try{var response=fetch(binaryFile,{credentials:"same-origin"});var instantiationResult=await WebAssembly.instantiateStreaming(response,imports);return instantiationResult}catch(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation")}}return instantiateArrayBuffer(binaryFile,imports)}function getWasmImports(){var imports={env:wasmImports,wasi_snapshot_preview1:wasmImports};return imports}async function createWasm(){function receiveInstance(instance,module){wasmExports=instance.exports;wasmExports=applySignatureConversions(wasmExports);assignWasmExports(wasmExports);updateMemoryViews();return wasmExports}function receiveInstantiationResult(result){return receiveInstance(result["instance"])}var info=getWasmImports();if(Module["instantiateWasm"]){return new Promise((resolve,reject)=>{Module["instantiateWasm"](info,(inst,mod)=>{resolve(receiveInstance(inst,mod))})})}wasmBinaryFile??=findWasmBinary();var result=await instantiateAsync(wasmBinary,wasmBinaryFile,info);var exports=receiveInstantiationResult(result);return exports}class ExitStatus{name="ExitStatus";constructor(status){this.message=`Program terminated with exit(${status})`;this.status=status}}var HEAP16;var HEAP32;var HEAP64;var HEAP8;var HEAPF32;var HEAPF64;var HEAPU16;var HEAPU32;var HEAPU64;var HEAPU8;var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module)}};var onPostRuns=[];var addOnPostRun=cb=>onPostRuns.push(cb);var onPreRuns=[];var addOnPreRun=cb=>onPreRuns.push(cb);var noExitRuntime=true;function setValue(ptr,value,type="i8"){if(type.endsWith("*"))type="*";switch(type){case"i1":HEAP8[ptr>>>0]=value;break;case"i8":HEAP8[ptr>>>0]=value;break;case"i16":HEAP16[ptr>>>1>>>0]=value;break;case"i32":HEAP32[ptr>>>2>>>0]=value;break;case"i64":HEAP64[ptr>>>3>>>0]=BigInt(value);break;case"float":HEAPF32[ptr>>>2>>>0]=value;break;case"double":HEAPF64[ptr>>>3>>>0]=value;break;case"*":HEAPU32[ptr>>>2>>>0]=value;break;default:abort(`invalid type for setValue: ${type}`)}}var stackRestore=val=>__emscripten_stack_restore(val);var stackSave=()=>_emscripten_stack_get_current();class ExceptionInfo{constructor(excPtr){this.excPtr=excPtr;this.ptr=excPtr-24}set_type(type){HEAPU32[this.ptr+4>>>2>>>0]=type}get_type(){return HEAPU32[this.ptr+4>>>2>>>0]}set_destructor(destructor){HEAPU32[this.ptr+8>>>2>>>0]=destructor}get_destructor(){return HEAPU32[this.ptr+8>>>2>>>0]}set_caught(caught){caught=caught?1:0;HEAP8[this.ptr+12>>>0]=caught}get_caught(){return HEAP8[this.ptr+12>>>0]!=0}set_rethrown(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+13>>>0]=rethrown}get_rethrown(){return HEAP8[this.ptr+13>>>0]!=0}init(type,destructor){this.set_adjusted_ptr(0);this.set_type(type);this.set_destructor(destructor)}set_adjusted_ptr(adjustedPtr){HEAPU32[this.ptr+16>>>2>>>0]=adjustedPtr}get_adjusted_ptr(){return HEAPU32[this.ptr+16>>>2>>>0]}}var uncaughtExceptionCount=0;var INT53_MAX=9007199254740992;var INT53_MIN=-9007199254740992;var bigintToI53Checked=num=>num<INT53_MIN||num>INT53_MAX?NaN:Number(num);function ___cxa_throw(ptr,type,destructor){ptr>>>=0;type>>>=0;destructor>>>=0;var info=new ExceptionInfo(ptr);info.init(type,destructor);uncaughtExceptionCount++;abort()}var syscallGetVarargI=()=>{var ret=HEAP32[+SYSCALLS.varargs>>>2>>>0];SYSCALLS.varargs+=4;return ret};var syscallGetVarargP=syscallGetVarargI;var PATH={isAbs:path=>path.charAt(0)==="/",splitPath:filename=>{var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:(parts,allowAboveRoot)=>{var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up;up--){parts.unshift("..")}}return parts},normalize:path=>{var isAbsolute=PATH.isAbs(path),trailingSlash=path.slice(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(p=>!!p),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path},dirname:path=>{var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return"."}if(dir){dir=dir.slice(0,-1)}return root+dir},basename:path=>path&&path.match(/([^\/]+|\/)\/*$/)[1],join:(...paths)=>PATH.normalize(paths.join("/")),join2:(l,r)=>PATH.normalize(l+"/"+r)};var initRandomFill=()=>{if(ENVIRONMENT_IS_NODE){var nodeCrypto=require("node:crypto");return view=>nodeCrypto.randomFillSync(view)}return view=>(crypto.getRandomValues(view),0)};var randomFill=view=>(randomFill=initRandomFill())(view);var PATH_FS={resolve:(...args)=>{var resolvedPath="",resolvedAbsolute=false;for(var i=args.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?args[i]:FS.cwd();if(typeof path!="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=PATH.isAbs(path)}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p),!resolvedAbsolute).join("/");return(resolvedAbsolute?"/":"")+resolvedPath||"."},relative:(from,to)=>{from=PATH_FS.resolve(from).slice(1);to=PATH_FS.resolve(to).slice(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return[];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..")}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var UTF8Decoder=globalThis.TextDecoder&&new TextDecoder;var findStringEnd=(heapOrArray,idx,maxBytesToRead,ignoreNul)=>{var maxIdx=idx+maxBytesToRead;if(ignoreNul)return maxIdx;while(heapOrArray[idx]&&!(idx>=maxIdx))++idx;return idx};var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead,ignoreNul)=>{idx>>>=0;var endPtr=findStringEnd(heapOrArray,idx,maxBytesToRead,ignoreNul);if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var FS_stdin_getChar_buffer=[];var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{outIdx>>>=0;if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.codePointAt(i);if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++>>>0]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++>>>0]=192|u>>6;heap[outIdx++>>>0]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++>>>0]=224|u>>12;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++>>>0]=240|u>>18;heap[outIdx++>>>0]=128|u>>12&63;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63;i++}}heap[outIdx>>>0]=0;return outIdx-startIdx};var intArrayFromString=(stringy,dontAddNull,length)=>{var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array};var FS_stdin_getChar=()=>{if(!FS_stdin_getChar_buffer.length){var result=null;if(ENVIRONMENT_IS_NODE){var BUFSIZE=256;var buf=Buffer.alloc(BUFSIZE);var bytesRead=0;var fd=process.stdin.fd;try{bytesRead=fs.readSync(fd,buf,0,BUFSIZE)}catch(e){if(e.toString().includes("EOF"))bytesRead=0;else throw e}if(bytesRead>0){result=buf.slice(0,bytesRead).toString("utf-8")}}else if(globalThis.window?.prompt){result=window.prompt("Input: ");if(result!==null){result+="\n"}}else{}if(!result){return null}FS_stdin_getChar_buffer=intArrayFromString(result,true)}return FS_stdin_getChar_buffer.shift()};var TTY={ttys:[],init(){},shutdown(){},register(dev,ops){TTY.ttys[dev]={input:[],output:[],ops};FS.registerDevice(dev,TTY.stream_ops)},stream_ops:{open(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false},close(stream){stream.tty.ops.fsync(stream.tty)},fsync(stream){stream.tty.ops.fsync(stream.tty)},read(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty)}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i])}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}},default_tty_ops:{get_char(tty){return FS_stdin_getChar()},put_char(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){out(UTF8ArrayToString(tty.output));tty.output=[]}},ioctl_tcgets(tty){return{c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ioctl_tcsets(tty,optional_actions,data){return 0},ioctl_tiocgwinsz(tty){return[24,80]}},default_tty1_ops:{put_char(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){err(UTF8ArrayToString(tty.output));tty.output=[]}}}};var mmapAlloc=size=>{abort()};var MEMFS={ops_table:null,mount(mount){return MEMFS.createNode(null,"/",16895,0)},createNode(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}MEMFS.ops_table||={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={}}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=MEMFS.emptyFileContents??=new Uint8Array(0)}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream}node.atime=node.mtime=node.ctime=Date.now();if(parent){parent.contents[name]=node;parent.atime=parent.mtime=parent.ctime=node.atime}return node},getFileDataAsTypedArray(node){return node.contents.subarray(0,node.usedBytes)},expandFileStorage(node,newCapacity){var prevCapacity=node.contents.length;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity)newCapacity=Math.max(newCapacity,256);var oldContents=MEMFS.getFileDataAsTypedArray(node);node.contents=new Uint8Array(newCapacity);node.contents.set(oldContents)},resizeFileStorage(node,newSize){if(node.usedBytes==newSize)return;var oldContents=node.contents;node.contents=new Uint8Array(newSize);node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));node.usedBytes=newSize},node_ops:{getattr(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096}else if(FS.isFile(node.mode)){attr.size=node.usedBytes}else if(FS.isLink(node.mode)){attr.size=node.link.length}else{attr.size=0}attr.atime=new Date(node.atime);attr.mtime=new Date(node.mtime);attr.ctime=new Date(node.ctime);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr(node,attr){for(const key of["mode","atime","mtime","ctime"]){if(attr[key]!=null){node[key]=attr[key]}}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size)}},lookup(parent,name){if(!MEMFS.doesNotExistError){MEMFS.doesNotExistError=new FS.ErrnoError(44);MEMFS.doesNotExistError.stack="<generic error, no stack>"}throw MEMFS.doesNotExistError},mknod(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename(old_node,new_dir,new_name){var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(new_node){if(FS.isDir(old_node.mode)){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}FS.hashRemoveNode(new_node)}delete old_node.parent.contents[old_node.name];new_dir.contents[new_name]=old_node;old_node.name=new_name;new_dir.ctime=new_dir.mtime=old_node.parent.ctime=old_node.parent.mtime=Date.now()},unlink(parent,name){delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},rmdir(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},readdir(node){return[".","..",...Object.keys(node.contents)]},symlink(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);buffer.set(contents.subarray(position,position+size),offset);return size},write(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===HEAP8.buffer){canOwn=false}if(!length)return 0;var node=stream.node;node.mtime=node.ctime=Date.now();if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length}else if(node.usedBytes===0&&position===0){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length}else{MEMFS.expandFileStorage(node,position+length);node.contents.set(buffer.subarray(offset,offset+length),position);node.usedBytes=Math.max(node.usedBytes,position+length)}return length},llseek(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes}}if(position<0){throw new FS.ErrnoError(28)}return position},mmap(stream,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents.buffer===HEAP8.buffer){allocated=false;ptr=contents.byteOffset}else{allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}if(contents){if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length)}else{contents=Array.prototype.slice.call(contents,position,position+length)}}HEAP8.set(contents,ptr>>>0)}}return{ptr,allocated}},msync(stream,buffer,offset,length,mmapFlags){MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS_modeStringToFlags=str=>{if(typeof str!="string")return str;var flagModes={r:0,"r+":2,w:512|64|1,"w+":512|64|2,a:1024|64|1,"a+":1024|64|2};var flags=flagModes[str];if(typeof flags=="undefined"){throw new Error(`Unknown file open mode: ${str}`)}return flags};var FS_fileDataToTypedArray=data=>{if(typeof data=="string"){data=intArrayFromString(data,true)}if(!data.subarray){data=new Uint8Array(data)}return data};var FS_getMode=(canRead,canWrite)=>{var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode};var asyncLoad=async url=>{var arrayBuffer=await readAsync(url);return new Uint8Array(arrayBuffer)};var FS_createDataFile=(...args)=>FS.createDataFile(...args);var getUniqueRunDependency=id=>id;var runDependencies=0;var dependenciesFulfilled=null;var removeRunDependency=id=>{runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}};var addRunDependency=id=>{runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)};var preloadPlugins=[];var FS_handledByPreloadPlugin=async(byteArray,fullname)=>{if(typeof Browser!="undefined")Browser.init();for(var plugin of preloadPlugins){if(plugin["canHandle"](fullname)){return plugin["handle"](byteArray,fullname)}}return byteArray};var FS_preloadFile=async(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish)=>{var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;var dep=getUniqueRunDependency(`cp ${fullname}`);addRunDependency(dep);try{var byteArray=url;if(typeof url=="string"){byteArray=await asyncLoad(url)}byteArray=await FS_handledByPreloadPlugin(byteArray,fullname);preFinish?.();if(!dontCreateFile){FS_createDataFile(parent,name,byteArray,canRead,canWrite,canOwn)}}finally{removeRunDependency(dep)}};var FS_createPreloadedFile=(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{FS_preloadFile(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish).then(onload).catch(onerror)};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,filesystems:null,syncFSRequests:0,ErrnoError:class{name="ErrnoError";constructor(errno){this.errno=errno}},FSStream:class{shared={};get object(){return this.node}set object(val){this.node=val}get isRead(){return(this.flags&2097155)!==1}get isWrite(){return(this.flags&2097155)!==0}get isAppend(){return this.flags&1024}get flags(){return this.shared.flags}set flags(val){this.shared.flags=val}get position(){return this.shared.position}set position(val){this.shared.position=val}},FSNode:class{node_ops={};stream_ops={};readMode=292|73;writeMode=146;mounted=null;constructor(parent,name,mode,rdev){if(!parent){parent=this}this.parent=parent;this.mount=parent.mount;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.rdev=rdev;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(val){val?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(val){val?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return FS.isDir(this.mode)}get isDevice(){return FS.isChrdev(this.mode)}},lookupPath(path,opts={}){if(!path){throw new FS.ErrnoError(44)}opts.follow_mount??=true;if(!PATH.isAbs(path)){path=FS.cwd()+"/"+path}linkloop:for(var nlinks=0;nlinks<40;nlinks++){var parts=path.split("/").filter(p=>!!p);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}if(parts[i]==="."){continue}if(parts[i]===".."){current_path=PATH.dirname(current_path);if(FS.isRoot(current)){path=current_path+"/"+parts.slice(i+1).join("/");nlinks--;continue linkloop}else{current=current.parent}continue}current_path=PATH.join2(current_path,parts[i]);try{current=FS.lookupNode(current,parts[i])}catch(e){if(e?.errno===44&&islast&&opts.noent_okay){return{path:current_path}}throw e}if(FS.isMountpoint(current)&&(!islast||opts.follow_mount)){current=current.mounted.root}if(FS.isLink(current.mode)&&(!islast||opts.follow)){if(!current.node_ops.readlink){throw new FS.ErrnoError(52)}var link=current.node_ops.readlink(current);if(!PATH.isAbs(link)){link=PATH.dirname(current_path)+"/"+link}path=link+"/"+parts.slice(i+1).join("/");continue linkloop}}return{path:current_path,node:current}}throw new FS.ErrnoError(32)},getPath(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?`${mount}/${path}`:mount+path}path=path?`${node.name}/${path}`:node.name;node=node.parent}},hashName(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0}return(parentid+hash>>>0)%FS.nameTable.length},hashAddNode(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node},hashRemoveNode(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next}else{var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next}}},lookupNode(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode(node){FS.hashRemoveNode(node)},isRoot(node){return node===node.parent},isMountpoint(node){return!!node.mounted},isFile(mode){return(mode&61440)===32768},isDir(mode){return(mode&61440)===16384},isLink(mode){return(mode&61440)===40960},isChrdev(mode){return(mode&61440)===8192},isBlkdev(mode){return(mode&61440)===24576},isFIFO(mode){return(mode&61440)===4096},isSocket(mode){return(mode&49152)===49152},flagsToPermissionString(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w"}return perms},nodePermissions(node,perms){if(FS.ignorePermissions){return 0}if(perms.includes("r")&&!(node.mode&292)){return 2}if(perms.includes("w")&&!(node.mode&146)){return 2}if(perms.includes("x")&&!(node.mode&73)){return 2}return 0},mayLookup(dir){if(!FS.isDir(dir.mode))return 54;var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate(dir,name){if(!FS.isDir(dir.mode)){return 54}try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name)}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else if(FS.isDir(node.mode)){return 31}return 0},mayOpen(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}var mode=FS.flagsToPermissionString(flags);if(FS.isDir(node.mode)){if(mode!=="r"||flags&(512|64)){return 31}}return FS.nodePermissions(node,mode)},checkOpExists(op,err){if(!op){throw new FS.ErrnoError(err)}return op},MAX_OPEN_FDS:4096,nextfd(){for(var fd=0;fd<=FS.MAX_OPEN_FDS;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStreamChecked(fd){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}return stream},getStream:fd=>FS.streams[fd],createStream(stream,fd=-1){stream=Object.assign(new FS.FSStream,stream);if(fd==-1){fd=FS.nextfd()}stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream(fd){FS.streams[fd]=null},dupStream(origStream,fd=-1){var stream=FS.createStream(origStream,fd);stream.stream_ops?.dup?.(stream);return stream},doSetAttr(stream,node,attr){var setattr=stream?.stream_ops.setattr;var arg=setattr?stream:node;setattr??=node.node_ops.setattr;FS.checkOpExists(setattr,63);try{setattr(arg,attr)}catch(e){if(e instanceof RangeError){throw new FS.ErrnoError(22)}throw e}},chrdev_stream_ops:{open(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;stream.stream_ops.open?.(stream)},llseek(){throw new FS.ErrnoError(70)}},major:dev=>dev>>8,minor:dev=>dev&255,makedev:(ma,mi)=>ma<<8|mi,registerDevice(dev,ops){FS.devices[dev]={stream_ops:ops}},getDevice:dev=>FS.devices[dev],getMounts(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push(...m.mounts)}return mounts},syncfs(populate,callback){if(typeof populate=="function"){callback=populate;populate=false}FS.syncFSRequests++;if(FS.syncFSRequests>1){err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null)}}for(var mount of mounts){if(mount.type.syncfs){mount.type.syncfs(mount,populate,done)}else{done(null)}}},mount(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type,opts,mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount)}}return mountRoot},unmount(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);for(var[hash,current]of Object.entries(FS.nameTable)){while(current){var next=current.name_next;if(mounts.includes(current.mount)){FS.destroyNode(current)}current=next}}node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1)},lookup(parent,name){return parent.node_ops.lookup(parent,name)},mknod(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name){throw new FS.ErrnoError(28)}if(name==="."||name===".."){throw new FS.ErrnoError(20)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},statfs(path){return FS.statfsNode(FS.lookupPath(path,{follow:true}).node)},statfsStream(stream){return FS.statfsNode(stream.node)},statfsNode(node){var rtn={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:FS.nextInode,ffree:FS.nextInode-1,fsid:42,flags:2,namelen:255};if(node.node_ops.statfs){Object.assign(rtn,node.node_ops.statfs(node.mount.opts.root))}return rtn},create(path,mode=438){mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir(path,mode=511){mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree(path,mode){var dirs=path.split("/");var d="";for(var dir of dirs){if(!dir)continue;if(d||PATH.isAbs(path))d+="/";d+=dir;try{FS.mkdir(d,mode)}catch(e){if(e.errno!=20)throw e}}},mkdev(path,mode,dev){if(typeof dev=="undefined"){dev=mode;mode=438}mode|=8192;return FS.mknod(path,mode,dev)},symlink(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},rename(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);old_node.parent=new_dir}catch(e){throw e}finally{FS.hashAddNode(old_node)}},rmdir(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.rmdir(parent,name);FS.destroyNode(node)},readdir(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var readdir=FS.checkOpExists(node.node_ops.readdir,54);return readdir(node)},unlink(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.unlink(parent,name);FS.destroyNode(node)},readlink(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return link.node_ops.readlink(link)},stat(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;var getattr=FS.checkOpExists(node.node_ops.getattr,63);return getattr(node)},fstat(fd){var stream=FS.getStreamChecked(fd);var node=stream.node;var getattr=stream.stream_ops.getattr;var arg=getattr?stream:node;getattr??=node.node_ops.getattr;FS.checkOpExists(getattr,63);return getattr(arg)},lstat(path){return FS.stat(path,true)},doChmod(stream,node,mode,dontFollow){FS.doSetAttr(stream,node,{mode:mode&4095|node.mode&~4095,ctime:Date.now(),dontFollow})},chmod(path,mode,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChmod(null,node,mode,dontFollow)},lchmod(path,mode){FS.chmod(path,mode,true)},fchmod(fd,mode){var stream=FS.getStreamChecked(fd);FS.doChmod(stream,stream.node,mode,false)},doChown(stream,node,dontFollow){FS.doSetAttr(stream,node,{timestamp:Date.now(),dontFollow})},chown(path,uid,gid,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChown(null,node,dontFollow)},lchown(path,uid,gid){FS.chown(path,uid,gid,true)},fchown(fd,uid,gid){var stream=FS.getStreamChecked(fd);FS.doChown(stream,stream.node,false)},doTruncate(stream,node,len){if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}FS.doSetAttr(stream,node,{size:len,timestamp:Date.now()})},truncate(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node}else{node=path}FS.doTruncate(null,node,len)},ftruncate(fd,len){var stream=FS.getStreamChecked(fd);if(len<0||(stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.doTruncate(stream,stream.node,len)},utime(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var setattr=FS.checkOpExists(node.node_ops.setattr,63);setattr(node,{atime,mtime})},open(path,flags,mode=438){if(path===""){throw new FS.ErrnoError(44)}flags=FS_modeStringToFlags(flags);if(flags&64){mode=mode&4095|32768}else{mode=0}var node;var isDirPath;if(typeof path=="object"){node=path}else{isDirPath=path.endsWith("/");var lookup=FS.lookupPath(path,{follow:!(flags&131072),noent_okay:true});node=lookup.node;path=lookup.path}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else if(isDirPath){throw new FS.ErrnoError(31)}else{node=FS.mknod(path,mode|511,0);created=true}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512&&!created){FS.truncate(node,0)}flags&=~(128|512|131072);var stream=FS.createStream({node,path:FS.getPath(node),flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false});if(stream.stream_ops.open){stream.stream_ops.open(stream)}if(created){FS.chmod(node,mode&511)}return stream},close(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream)}}catch(e){throw e}finally{FS.closeStream(stream.fd)}stream.fd=null},isClosed(stream){return stream.fd===null},llseek(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;return bytesWritten},mmap(stream,length,position,prot,flags){if((prot&2)!==0&&(flags&2)===0&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}if(!length){throw new FS.ErrnoError(28)}return stream.stream_ops.mmap(stream,length,position,prot,flags)},msync(stream,buffer,offset,length,mmapFlags){if(!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},ioctl(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile(path,opts={}){opts.flags=opts.flags??0;opts.encoding=opts.encoding??"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){abort(`Invalid encoding type "${opts.encoding}"`)}var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){buf=UTF8ArrayToString(buf)}FS.close(stream);return buf},writeFile(path,data,opts={}){opts.flags=opts.flags??577;var stream=FS.open(path,opts.flags,opts.mode);data=FS_fileDataToTypedArray(data);FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn);FS.close(stream)},cwd:()=>FS.currentPath,chdir(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path},createDefaultDirectories(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user")},createDefaultDevices(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:()=>0,write:(stream,buffer,offset,length,pos)=>length,llseek:()=>0});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var randomBuffer=new Uint8Array(1024),randomLeft=0;var randomByte=()=>{if(randomLeft===0){randomFill(randomBuffer);randomLeft=randomBuffer.byteLength}return randomBuffer[--randomLeft]};FS.createDevice("/dev","random",randomByte);FS.createDevice("/dev","urandom",randomByte);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp")},createSpecialDirectories(){FS.mkdir("/proc");var proc_self=FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount(){var node=FS.createNode(proc_self,"fd",16895,73);node.stream_ops={llseek:MEMFS.stream_ops.llseek};node.node_ops={lookup(parent,name){var fd=+name;var stream=FS.getStreamChecked(fd);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:()=>stream.path},id:fd+1};ret.parent=ret;return ret},readdir(){return Array.from(FS.streams.entries()).filter(([k,v])=>v).map(([k,v])=>k.toString())}};return node}},{},"/proc/self/fd")},createStandardStreams(input,output,error){if(input){FS.createDevice("/dev","stdin",input)}else{FS.symlink("/dev/tty","/dev/stdin")}if(output){FS.createDevice("/dev","stdout",null,output)}else{FS.symlink("/dev/tty","/dev/stdout")}if(error){FS.createDevice("/dev","stderr",null,error)}else{FS.symlink("/dev/tty1","/dev/stderr")}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1)},staticInit(){FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={MEMFS}},init(input,output,error){FS.initialized=true;input??=Module["stdin"];output??=Module["stdout"];error??=Module["stderr"];FS.createStandardStreams(input,output,error)},quit(){FS.initialized=false;for(var stream of FS.streams){if(stream){FS.close(stream)}}},findObject(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(!ret.exists){return null}return ret.object},analyzePath(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/"}catch(e){ret.error=e.errno}return ret},createPath(parent,path,canRead,canWrite){parent=typeof parent=="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current)}catch(e){if(e.errno!=20)throw e}parent=current}return current},createFile(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile(parent,name,data,canRead,canWrite,canOwn){var path=name;if(parent){parent=typeof parent=="string"?parent:FS.getPath(parent);path=name?PATH.join2(parent,name):parent}var mode=FS_getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){data=FS_fileDataToTypedArray(data);FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode)}},createDevice(parent,name,input,output){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(!!input,!!output);FS.createDevice.major??=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open(stream){stream.seekable=false},close(stream){if(output?.buffer?.length){output(10)}},read(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input()}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i])}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(globalThis.XMLHttpRequest){abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else{try{obj.contents=readBinary(obj.url)}catch(e){throw new FS.ErrnoError(29)}}},createLazyFile(parent,name,url,canRead,canWrite){class LazyUint8Array{lengthKnown=false;chunks=[];get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]}setDataGetter(getter){this.getter=getter}cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn't load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(from,to)=>{if(from>to)abort(`invalid range (${from}, ${to}) or no bytes requested!`);if(to>datalength-1)abort(`only ${datalength} bytes available! programmer error!`);var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined")}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort("Couldn't load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}return intArrayFromString(xhr.responseText??"",true)};var lazyArray=this;lazyArray.setDataGetter(chunkNum=>{var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]=="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end)}if(typeof lazyArray.chunks[chunkNum]=="undefined")abort("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed")}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true}get length(){if(!this.lengthKnown){this.cacheLength()}return this._length}get chunkSize(){if(!this.lengthKnown){this.cacheLength()}return this._chunkSize}}if(globalThis.XMLHttpRequest){if(!ENVIRONMENT_IS_WORKER)abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray}}else{var properties={isDevice:false,url}}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents}else if(properties.url){node.contents=null;node.url=properties.url}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};for(const[key,fn]of Object.entries(node.stream_ops)){stream_ops[key]=(...args)=>{FS.forceLoadFile(node);return fn(...args)}}function writeChunks(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i]}}else{for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i)}}return size}stream_ops.read=(stream,buffer,offset,length,position)=>{FS.forceLoadFile(node);return writeChunks(stream,buffer,offset,length,position)};stream_ops.mmap=(stream,length,position,prot,flags)=>{FS.forceLoadFile(node);var ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}writeChunks(stream,HEAP8,ptr,length,position);return{ptr,allocated:true}};node.stream_ops=stream_ops;return node}};var UTF8ToString=(ptr,maxBytesToRead,ignoreNul)=>{ptr>>>=0;return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead,ignoreNul):""};var SYSCALLS={currentUmask:18,calculateAt(dirfd,path,allowEmpty){if(PATH.isAbs(path)){return path}var dir;if(dirfd===-100){dir=FS.cwd()}else{var dirstream=SYSCALLS.getStreamFromFD(dirfd);dir=dirstream.path}if(path.length==0){if(!allowEmpty){throw new FS.ErrnoError(44)}return dir}return dir+"/"+path},writeStat(buf,stat){HEAPU32[buf>>>2>>>0]=stat.dev;HEAPU32[buf+4>>>2>>>0]=stat.mode;HEAPU32[buf+8>>>2>>>0]=stat.nlink;HEAPU32[buf+12>>>2>>>0]=stat.uid;HEAPU32[buf+16>>>2>>>0]=stat.gid;HEAPU32[buf+20>>>2>>>0]=stat.rdev;HEAP64[buf+24>>>3>>>0]=BigInt(stat.size);HEAP32[buf+32>>>2>>>0]=4096;HEAP32[buf+36>>>2>>>0]=stat.blocks;var atime=stat.atime.getTime();var mtime=stat.mtime.getTime();var ctime=stat.ctime.getTime();HEAP64[buf+40>>>3>>>0]=BigInt(Math.floor(atime/1e3));HEAPU32[buf+48>>>2>>>0]=atime%1e3*1e3*1e3;HEAP64[buf+56>>>3>>>0]=BigInt(Math.floor(mtime/1e3));HEAPU32[buf+64>>>2>>>0]=mtime%1e3*1e3*1e3;HEAP64[buf+72>>>3>>>0]=BigInt(Math.floor(ctime/1e3));HEAPU32[buf+80>>>2>>>0]=ctime%1e3*1e3*1e3;HEAP64[buf+88>>>3>>>0]=BigInt(stat.ino);return 0},writeStatFs(buf,stats){HEAPU32[buf+4>>>2>>>0]=stats.bsize;HEAPU32[buf+60>>>2>>>0]=stats.bsize;HEAP64[buf+8>>>3>>>0]=BigInt(stats.blocks);HEAP64[buf+16>>>3>>>0]=BigInt(stats.bfree);HEAP64[buf+24>>>3>>>0]=BigInt(stats.bavail);HEAP64[buf+32>>>3>>>0]=BigInt(stats.files);HEAP64[buf+40>>>3>>>0]=BigInt(stats.ffree);HEAPU32[buf+48>>>2>>>0]=stats.fsid;HEAPU32[buf+64>>>2>>>0]=stats.flags;HEAPU32[buf+56>>>2>>>0]=stats.namelen},doMsync(addr,stream,len,flags,offset){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(flags&2){return 0}var buffer=HEAPU8.slice(addr,addr+len);FS.msync(stream,buffer,offset,len,flags)},getStreamFromFD(fd){var stream=FS.getStreamChecked(fd);return stream},varargs:undefined,getStr(ptr){var ret=UTF8ToString(ptr);return ret}};function ___syscall_fcntl64(fd,cmd,varargs){varargs>>>=0;SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(cmd){case 0:{var arg=syscallGetVarargI();if(arg<0){return-28}while(FS.streams[arg]){arg++}var newStream;newStream=FS.dupStream(stream,arg);return newStream.fd}case 1:case 2:return 0;case 3:return stream.flags;case 4:{var arg=syscallGetVarargI();var mask=289792;stream.flags=stream.flags&~mask|arg&mask;return 0}case 12:{var arg=syscallGetVarargP();var offset=0;HEAP16[arg+offset>>>1>>>0]=2;return 0}case 13:case 14:return 0}return-28}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_fstat64(fd,buf){buf>>>=0;try{return SYSCALLS.writeStat(buf,FS.fstat(fd))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_ioctl(fd,op,varargs){varargs>>>=0;SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(op){case 21509:{if(!stream.tty)return-59;return 0}case 21505:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcgets){var termios=stream.tty.ops.ioctl_tcgets(stream);var argp=syscallGetVarargP();HEAP32[argp>>>2>>>0]=termios.c_iflag||0;HEAP32[argp+4>>>2>>>0]=termios.c_oflag||0;HEAP32[argp+8>>>2>>>0]=termios.c_cflag||0;HEAP32[argp+12>>>2>>>0]=termios.c_lflag||0;for(var i=0;i<32;i++){HEAP8[argp+i+17>>>0]=termios.c_cc[i]||0}return 0}return 0}case 21510:case 21511:case 21512:{if(!stream.tty)return-59;return 0}case 21506:case 21507:case 21508:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcsets){var argp=syscallGetVarargP();var c_iflag=HEAP32[argp>>>2>>>0];var c_oflag=HEAP32[argp+4>>>2>>>0];var c_cflag=HEAP32[argp+8>>>2>>>0];var c_lflag=HEAP32[argp+12>>>2>>>0];var c_cc=[];for(var i=0;i<32;i++){c_cc.push(HEAP8[argp+i+17>>>0])}return stream.tty.ops.ioctl_tcsets(stream.tty,op,{c_iflag,c_oflag,c_cflag,c_lflag,c_cc})}return 0}case 21519:{if(!stream.tty)return-59;var argp=syscallGetVarargP();HEAP32[argp>>>2>>>0]=0;return 0}case 21520:{if(!stream.tty)return-59;return-28}case 21537:case 21531:{var argp=syscallGetVarargP();return FS.ioctl(stream,op,argp)}case 21523:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tiocgwinsz){var winsize=stream.tty.ops.ioctl_tiocgwinsz(stream.tty);var argp=syscallGetVarargP();HEAP16[argp>>>1>>>0]=winsize[0];HEAP16[argp+2>>>1>>>0]=winsize[1]}return 0}case 21524:{if(!stream.tty)return-59;return 0}case 21515:{if(!stream.tty)return-59;return 0}default:return-28}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_lstat64(path,buf){path>>>=0;buf>>>=0;try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.lstat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_newfstatat(dirfd,path,buf,flags){path>>>=0;buf>>>=0;try{path=SYSCALLS.getStr(path);var nofollow=flags&256;var allowEmpty=flags&4096;flags=flags&~6400;path=SYSCALLS.calculateAt(dirfd,path,allowEmpty);return SYSCALLS.writeStat(buf,nofollow?FS.lstat(path):FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_openat(dirfd,path,flags,varargs){path>>>=0;varargs>>>=0;SYSCALLS.varargs=varargs;try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);var mode=varargs?syscallGetVarargI():0;if(flags&64){mode&=~SYSCALLS.currentUmask}return FS.open(path,flags,mode).fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_stat64(path,buf){path>>>=0;buf>>>=0;try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __abort_js=()=>abort("");var AsciiToString=ptr=>{ptr>>>=0;var str="";while(1){var ch=HEAPU8[ptr++>>>0];if(!ch)return str;str+=String.fromCharCode(ch)}};var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var BindingError=class BindingError extends Error{constructor(message){super(message);this.name="BindingError"}};var throwBindingError=message=>{throw new BindingError(message)};function sharedRegisterType(rawType,registeredInstance,options={}){var name=registeredInstance.name;if(!rawType){throwBindingError(`type "${name}" must have a positive integer typeid pointer`)}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return}else{throwBindingError(`Cannot register type '${name}' twice`)}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach(cb=>cb())}}function registerType(rawType,registeredInstance,options={}){return sharedRegisterType(rawType,registeredInstance,options)}var integerReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?pointer=>HEAP8[pointer>>>0]:pointer=>HEAPU8[pointer>>>0];case 2:return signed?pointer=>HEAP16[pointer>>>1>>>0]:pointer=>HEAPU16[pointer>>>1>>>0];case 4:return signed?pointer=>HEAP32[pointer>>>2>>>0]:pointer=>HEAPU32[pointer>>>2>>>0];case 8:return signed?pointer=>HEAP64[pointer>>>3>>>0]:pointer=>HEAPU64[pointer>>>3>>>0];default:throw new TypeError(`invalid integer width (${width}): ${name}`)}};var __embind_register_bigint=function(primitiveType,name,size,minRange,maxRange){primitiveType>>>=0;name>>>=0;size>>>=0;name=AsciiToString(name);const isUnsignedType=minRange===0n;let fromWireType=value=>value;if(isUnsignedType){const bitSize=size*8;fromWireType=value=>BigInt.asUintN(bitSize,value);maxRange=fromWireType(maxRange)}registerType(primitiveType,{name,fromWireType,toWireType:(destructors,value)=>{if(typeof value=="number"){value=BigInt(value)}return value},readValueFromPointer:integerReadValueFromPointer(name,size,!isUnsignedType),destructorFunction:null})};function __embind_register_bool(rawType,name,trueValue,falseValue){rawType>>>=0;name>>>=0;name=AsciiToString(name);registerType(rawType,{name,fromWireType:function(wt){return!!wt},toWireType:function(destructors,o){return o?trueValue:falseValue},readValueFromPointer:function(pointer){return this.fromWireType(HEAPU8[pointer>>>0])},destructorFunction:null})}var shallowCopyInternalPointer=o=>({count:o.count,deleteScheduled:o.deleteScheduled,preservePointerOnDelete:o.preservePointerOnDelete,ptr:o.ptr,ptrType:o.ptrType,smartPtr:o.smartPtr,smartPtrType:o.smartPtrType});var throwInstanceAlreadyDeleted=obj=>{function getInstanceTypeName(handle){return handle.$$.ptrType.registeredClass.name}throwBindingError(getInstanceTypeName(obj)+" instance already deleted")};var finalizationRegistry=false;var detachFinalizer=handle=>{};var runDestructor=$$=>{if($$.smartPtr){$$.smartPtrType.rawDestructor($$.smartPtr)}else{$$.ptrType.registeredClass.rawDestructor($$.ptr)}};var releaseClassHandle=$$=>{$$.count.value-=1;var toDelete=0===$$.count.value;if(toDelete){runDestructor($$)}};var attachFinalizer=handle=>{if(!globalThis.FinalizationRegistry){attachFinalizer=handle=>handle;return handle}finalizationRegistry=new FinalizationRegistry(info=>{releaseClassHandle(info.$$)});attachFinalizer=handle=>{var $$=handle.$$;var hasSmartPtr=!!$$.smartPtr;if(hasSmartPtr){var info={$$};finalizationRegistry.register(handle,info,handle)}return handle};detachFinalizer=handle=>finalizationRegistry.unregister(handle);return attachFinalizer(handle)};var deletionQueue=[];var flushPendingDeletes=()=>{while(deletionQueue.length){var obj=deletionQueue.pop();obj.$$.deleteScheduled=false;obj["delete"]()}};var delayFunction;var init_ClassHandle=()=>{let proto=ClassHandle.prototype;Object.assign(proto,{isAliasOf(other){if(!(this instanceof ClassHandle)){return false}if(!(other instanceof ClassHandle)){return false}var leftClass=this.$$.ptrType.registeredClass;var left=this.$$.ptr;other.$$=other.$$;var rightClass=other.$$.ptrType.registeredClass;var right=other.$$.ptr;while(leftClass.baseClass){left=leftClass.upcast(left);leftClass=leftClass.baseClass}while(rightClass.baseClass){right=rightClass.upcast(right);rightClass=rightClass.baseClass}return leftClass===rightClass&&left===right},clone(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.preservePointerOnDelete){this.$$.count.value+=1;return this}else{var clone=attachFinalizer(Object.create(Object.getPrototypeOf(this),{$$:{value:shallowCopyInternalPointer(this.$$)}}));clone.$$.count.value+=1;clone.$$.deleteScheduled=false;return clone}},delete(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion")}detachFinalizer(this);releaseClassHandle(this.$$);if(!this.$$.preservePointerOnDelete){this.$$.smartPtr=undefined;this.$$.ptr=undefined}},isDeleted(){return!this.$$.ptr},deleteLater(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion")}deletionQueue.push(this);if(deletionQueue.length===1&&delayFunction){delayFunction(flushPendingDeletes)}this.$$.deleteScheduled=true;return this}});const symbolDispose=Symbol.dispose;if(symbolDispose){proto[symbolDispose]=proto["delete"]}};function ClassHandle(){}var createNamedFunction=(name,func)=>Object.defineProperty(func,"name",{value:name});var registeredPointers={};var ensureOverloadTable=(proto,methodName,humanName)=>{if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=function(...args){if(!proto[methodName].overloadTable.hasOwnProperty(args.length)){throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`)}return proto[methodName].overloadTable[args.length].apply(this,args)};proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc}};var exposePublicSymbol=(name,value,numArguments)=>{if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError(`Cannot register public name '${name}' twice`)}ensureOverloadTable(Module,name,name);if(Module[name].overloadTable.hasOwnProperty(numArguments)){throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`)}Module[name].overloadTable[numArguments]=value}else{Module[name]=value;Module[name].argCount=numArguments}};var char_0=48;var char_9=57;var makeLegalFunctionName=name=>{name=name.replace(/[^a-zA-Z0-9_]/g,"$");var f=name.charCodeAt(0);if(f>=char_0&&f<=char_9){return`_${name}`}return name};function RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast){this.name=name;this.constructor=constructor;this.instancePrototype=instancePrototype;this.rawDestructor=rawDestructor;this.baseClass=baseClass;this.getActualType=getActualType;this.upcast=upcast;this.downcast=downcast;this.pureVirtualFunctions=[]}var upcastPointer=(ptr,ptrClass,desiredClass)=>{while(ptrClass!==desiredClass){if(!ptrClass.upcast){throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`)}ptr=ptrClass.upcast(ptr);ptrClass=ptrClass.baseClass}return ptr};var embindRepr=v=>{if(v===null){return"null"}var t=typeof v;if(t==="object"||t==="array"||t==="function"){return v.toString()}else{return""+v}};function constNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`)}return 0}if(!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`)}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`)}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function genericPointerToWireType(destructors,handle){var ptr;if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`)}if(this.isSmartPointer){ptr=this.rawConstructor();if(destructors!==null){destructors.push(this.rawDestructor,ptr)}return ptr}else{return 0}}if(!handle||!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`)}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`)}if(!this.isConst&&handle.$$.ptrType.isConst){throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name} to parameter type ${this.name}`)}var handleClass=handle.$$.ptrType.registeredClass;ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);if(this.isSmartPointer){if(undefined===handle.$$.smartPtr){throwBindingError("Passing raw pointer to smart pointer is illegal")}switch(this.sharingPolicy){case 0:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr}else{throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name} to parameter type ${this.name}`)}break;case 1:ptr=handle.$$.smartPtr;break;case 2:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr}else{var clonedHandle=handle["clone"]();ptr=this.rawShare(ptr,Emval.toHandle(()=>clonedHandle["delete"]()));if(destructors!==null){destructors.push(this.rawDestructor,ptr)}}break;default:throwBindingError("Unsupported sharing policy")}}return ptr}function nonConstNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`)}return 0}if(!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`)}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`)}if(handle.$$.ptrType.isConst){throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`)}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function readPointer(pointer){return this.fromWireType(HEAPU32[pointer>>>2>>>0])}var downcastPointer=(ptr,ptrClass,desiredClass)=>{if(ptrClass===desiredClass){return ptr}if(undefined===desiredClass.baseClass){return null}var rv=downcastPointer(ptr,ptrClass,desiredClass.baseClass);if(rv===null){return null}return desiredClass.downcast(rv)};var registeredInstances={};var getBasestPointer=(class_,ptr)=>{if(ptr===undefined){throwBindingError("ptr should not be undefined")}while(class_.baseClass){ptr=class_.upcast(ptr);class_=class_.baseClass}return ptr};var getInheritedInstance=(class_,ptr)=>{ptr=getBasestPointer(class_,ptr);return registeredInstances[ptr]};var InternalError=class InternalError extends Error{constructor(message){super(message);this.name="InternalError"}};var throwInternalError=message=>{throw new InternalError(message)};var makeClassHandle=(prototype,record)=>{if(!record.ptrType||!record.ptr){throwInternalError("makeClassHandle requires ptr and ptrType")}var hasSmartPtrType=!!record.smartPtrType;var hasSmartPtr=!!record.smartPtr;if(hasSmartPtrType!==hasSmartPtr){throwInternalError("Both smartPtrType and smartPtr must be specified")}record.count={value:1};return attachFinalizer(Object.create(prototype,{$$:{value:record,writable:true}}))};function RegisteredPointer_fromWireType(ptr){var rawPointer=this.getPointee(ptr);if(!rawPointer){this.destructor(ptr);return null}var registeredInstance=getInheritedInstance(this.registeredClass,rawPointer);if(undefined!==registeredInstance){if(0===registeredInstance.$$.count.value){registeredInstance.$$.ptr=rawPointer;registeredInstance.$$.smartPtr=ptr;return registeredInstance["clone"]()}else{var rv=registeredInstance["clone"]();this.destructor(ptr);return rv}}function makeDefaultHandle(){if(this.isSmartPointer){return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:rawPointer,smartPtrType:this,smartPtr:ptr})}else{return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this,ptr})}}var actualType=this.registeredClass.getActualType(rawPointer);var registeredPointerRecord=registeredPointers[actualType];if(!registeredPointerRecord){return makeDefaultHandle.call(this)}var toType;if(this.isConst){toType=registeredPointerRecord.constPointerType}else{toType=registeredPointerRecord.pointerType}var dp=downcastPointer(rawPointer,this.registeredClass,toType.registeredClass);if(dp===null){return makeDefaultHandle.call(this)}if(this.isSmartPointer){return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp,smartPtrType:this,smartPtr:ptr})}else{return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp})}}var init_RegisteredPointer=()=>{Object.assign(RegisteredPointer.prototype,{getPointee(ptr){if(this.rawGetPointee){ptr=this.rawGetPointee(ptr)}return ptr},destructor(ptr){this.rawDestructor?.(ptr)},readValueFromPointer:readPointer,fromWireType:RegisteredPointer_fromWireType})};function RegisteredPointer(name,registeredClass,isReference,isConst,isSmartPointer,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor){this.name=name;this.registeredClass=registeredClass;this.isReference=isReference;this.isConst=isConst;this.isSmartPointer=isSmartPointer;this.pointeeType=pointeeType;this.sharingPolicy=sharingPolicy;this.rawGetPointee=rawGetPointee;this.rawConstructor=rawConstructor;this.rawShare=rawShare;this.rawDestructor=rawDestructor;if(!isSmartPointer&&registeredClass.baseClass===undefined){if(isConst){this.toWireType=constNoSmartPtrRawPointerToWireType;this.destructorFunction=null}else{this.toWireType=nonConstNoSmartPtrRawPointerToWireType;this.destructorFunction=null}}else{this.toWireType=genericPointerToWireType}}var replacePublicSymbol=(name,value,numArguments)=>{if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistent public symbol")}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value}else{Module[name]=value;Module[name].argCount=numArguments}};var wasmTableMirror=[];var getWasmTableEntry=funcPtr=>{var func=wasmTableMirror[funcPtr];if(!func){wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr)}return func};var dynCall=(sig,ptr,args=[],promising=false)=>{var func=getWasmTableEntry(ptr);var rtn=func(...args);function convert(rtn){return sig[0]=="p"?rtn>>>0:rtn}return convert(rtn)};var getDynCaller=(sig,ptr,promising=false)=>(...args)=>dynCall(sig,ptr,args,promising);var embind__requireFunction=(signature,rawFunction,isAsync=false)=>{signature=AsciiToString(signature);function makeDynCaller(){if(signature.includes("p")){return getDynCaller(signature,rawFunction,isAsync)}var rtn=getWasmTableEntry(rawFunction);return rtn}var fp=makeDynCaller();if(typeof fp!="function"){throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`)}return fp};class UnboundTypeError extends Error{}var getTypeName=type=>{var ptr=___getTypeName(type);var rv=AsciiToString(ptr);_free(ptr);return rv};var throwUnboundTypeError=(message,types)=>{var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return}if(registeredTypes[type]){return}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return}unboundTypes.push(type);seen[type]=true}types.forEach(visit);throw new UnboundTypeError(`${message}: `+unboundTypes.map(getTypeName).join([", "]))};var whenDependentTypesAreResolved=(myTypes,dependentTypes,getTypeConverters)=>{myTypes.forEach(type=>typeDependencies[type]=dependentTypes);function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count")}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i])}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;for(let[i,dt]of dependentTypes.entries()){if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt]}else{unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[]}awaitingDependencies[dt].push(()=>{typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters)}})}}if(0===unregisteredTypes.length){onComplete(typeConverters)}};function __embind_register_class(rawType,rawPointerType,rawConstPointerType,baseClassRawType,getActualTypeSignature,getActualType,upcastSignature,upcast,downcastSignature,downcast,name,destructorSignature,rawDestructor){rawType>>>=0;rawPointerType>>>=0;rawConstPointerType>>>=0;baseClassRawType>>>=0;getActualTypeSignature>>>=0;getActualType>>>=0;upcastSignature>>>=0;upcast>>>=0;downcastSignature>>>=0;downcast>>>=0;name>>>=0;destructorSignature>>>=0;rawDestructor>>>=0;name=AsciiToString(name);getActualType=embind__requireFunction(getActualTypeSignature,getActualType);upcast&&=embind__requireFunction(upcastSignature,upcast);downcast&&=embind__requireFunction(downcastSignature,downcast);rawDestructor=embind__requireFunction(destructorSignature,rawDestructor);var legalFunctionName=makeLegalFunctionName(name);exposePublicSymbol(legalFunctionName,function(){throwUnboundTypeError(`Cannot construct ${name} due to unbound types`,[baseClassRawType])});whenDependentTypesAreResolved([rawType,rawPointerType,rawConstPointerType],baseClassRawType?[baseClassRawType]:[],base=>{base=base[0];var baseClass;var basePrototype;if(baseClassRawType){baseClass=base.registeredClass;basePrototype=baseClass.instancePrototype}else{basePrototype=ClassHandle.prototype}var constructor=createNamedFunction(name,function(...args){if(Object.getPrototypeOf(this)!==instancePrototype){throw new BindingError(`Use 'new' to construct ${name}`)}if(undefined===registeredClass.constructor_body){throw new BindingError(`${name} has no accessible constructor`)}var body=registeredClass.constructor_body[args.length];if(undefined===body){throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`)}return body.apply(this,args)});var instancePrototype=Object.create(basePrototype,{constructor:{value:constructor}});constructor.prototype=instancePrototype;var registeredClass=new RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast);if(registeredClass.baseClass){registeredClass.baseClass.__derivedClasses??=[];registeredClass.baseClass.__derivedClasses.push(registeredClass)}var referenceConverter=new RegisteredPointer(name,registeredClass,true,false,false);var pointerConverter=new RegisteredPointer(name+"*",registeredClass,false,false,false);var constPointerConverter=new RegisteredPointer(name+" const*",registeredClass,false,true,false);registeredPointers[rawType]={pointerType:pointerConverter,constPointerType:constPointerConverter};replacePublicSymbol(legalFunctionName,constructor);return[referenceConverter,pointerConverter,constPointerConverter]})}var runDestructors=destructors=>{while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr)}};var validateThis=(this_,classType,humanName)=>{if(!(this_ instanceof Object)){throwBindingError(`${humanName} with invalid "this": ${this_}`)}if(!(this_ instanceof classType.registeredClass.constructor)){throwBindingError(`${humanName} incompatible with "this" of type ${this_.constructor.name}`)}if(!this_.$$.ptr){throwBindingError(`cannot call emscripten binding method ${humanName} on deleted object`)}return upcastPointer(this_.$$.ptr,this_.$$.ptrType.registeredClass,classType.registeredClass)};var __embind_register_class_property=function(classType,fieldName,getterReturnType,getterSignature,getter,getterContext,setterArgumentType,setterSignature,setter,setterContext){classType>>>=0;fieldName>>>=0;getterReturnType>>>=0;getterSignature>>>=0;getter>>>=0;getterContext>>>=0;setterArgumentType>>>=0;setterSignature>>>=0;setter>>>=0;setterContext>>>=0;fieldName=AsciiToString(fieldName);getter=embind__requireFunction(getterSignature,getter);whenDependentTypesAreResolved([],[classType],classType=>{classType=classType[0];var humanName=`${classType.name}.${fieldName}`;var desc={get(){throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`,[getterReturnType,setterArgumentType])},enumerable:true,configurable:true};if(setter){desc.set=()=>throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`,[getterReturnType,setterArgumentType])}else{desc.set=v=>throwBindingError(humanName+" is a read-only property")}Object.defineProperty(classType.registeredClass.instancePrototype,fieldName,desc);whenDependentTypesAreResolved([],setter?[getterReturnType,setterArgumentType]:[getterReturnType],types=>{var getterReturnType=types[0];var desc={get(){var ptr=validateThis(this,classType,humanName+" getter");return getterReturnType.fromWireType(getter(getterContext,ptr))},enumerable:true};if(setter){setter=embind__requireFunction(setterSignature,setter);var setterArgumentType=types[1];desc.set=function(v){var ptr=validateThis(this,classType,humanName+" setter");var destructors=[];setter(setterContext,ptr,setterArgumentType.toWireType(destructors,v));runDestructors(destructors)}}Object.defineProperty(classType.registeredClass.instancePrototype,fieldName,desc);return[]});return[]})};var emval_freelist=[];var emval_handles=[0,1,,1,null,1,true,1,false,1];function __emval_decref(handle){handle>>>=0;if(handle>9&&0===--emval_handles[handle+1]){var value=emval_handles[handle];emval_handles[handle]=undefined;emval_freelist.push(handle)}}var Emval={toValue:handle=>{if(!handle){throwBindingError(`Cannot use deleted val. handle = ${handle}`)}return emval_handles[handle]},toHandle:value=>{switch(value){case undefined:return 2;case null:return 4;case true:return 6;case false:return 8;default:{const handle=emval_freelist.pop()||emval_handles.length;emval_handles[handle]=value;emval_handles[handle+1]=1;return handle}}}};var EmValType={name:"emscripten::val",fromWireType:handle=>{var rv=Emval.toValue(handle);__emval_decref(handle);return rv},toWireType:(destructors,value)=>Emval.toHandle(value),readValueFromPointer:readPointer,destructorFunction:null};function __embind_register_emval(rawType){rawType>>>=0;return registerType(rawType,EmValType)}var enumReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?function(pointer){return this.fromWireType(HEAP8[pointer>>>0])}:function(pointer){return this.fromWireType(HEAPU8[pointer>>>0])};case 2:return signed?function(pointer){return this.fromWireType(HEAP16[pointer>>>1>>>0])}:function(pointer){return this.fromWireType(HEAPU16[pointer>>>1>>>0])};case 4:return signed?function(pointer){return this.fromWireType(HEAP32[pointer>>>2>>>0])}:function(pointer){return this.fromWireType(HEAPU32[pointer>>>2>>>0])};default:throw new TypeError(`invalid integer width (${width}): ${name}`)}};function getEnumValueType(rawValueType){return rawValueType===0?"object":rawValueType===1?"number":"string"}function __embind_register_enum(rawType,name,size,isSigned,rawValueType){rawType>>>=0;name>>>=0;size>>>=0;name=AsciiToString(name);const valueType=getEnumValueType(rawValueType);switch(valueType){case"object":{function ctor(){}ctor.values={};registerType(rawType,{name,constructor:ctor,valueType,fromWireType:function(c){return this.constructor.values[c]},toWireType:(destructors,c)=>c.value,readValueFromPointer:enumReadValueFromPointer(name,size,isSigned),destructorFunction:null});exposePublicSymbol(name,ctor);break}case"number":{var keysMap={};registerType(rawType,{name,keysMap,valueType,fromWireType:c=>c,toWireType:(destructors,c)=>c,readValueFromPointer:enumReadValueFromPointer(name,size,isSigned),destructorFunction:null});exposePublicSymbol(name,keysMap);delete Module[name].argCount;break}case"string":{var valuesMap={};var reverseMap={};var keysMap={};registerType(rawType,{name,valuesMap,reverseMap,keysMap,valueType,fromWireType:function(c){return this.reverseMap[c]},toWireType:function(destructors,c){return this.valuesMap[c]},readValueFromPointer:enumReadValueFromPointer(name,size,isSigned),destructorFunction:null});exposePublicSymbol(name,keysMap);delete Module[name].argCount;break}}}var requireRegisteredType=(rawType,humanName)=>{var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`)}return impl};function __embind_register_enum_value(rawEnumType,name,enumValue){rawEnumType>>>=0;name>>>=0;var enumType=requireRegisteredType(rawEnumType,"enum");name=AsciiToString(name);switch(enumType.valueType){case"object":{var Enum=enumType.constructor;var Value=Object.create(enumType.constructor.prototype,{value:{value:enumValue},constructor:{value:createNamedFunction(`${enumType.name}_${name}`,function(){})}});Enum.values[enumValue]=Value;Enum[name]=Value;break}case"number":{enumType.keysMap[name]=enumValue;break}case"string":{enumType.valuesMap[name]=enumValue;enumType.reverseMap[enumValue]=name;enumType.keysMap[name]=name;break}}}var floatReadValueFromPointer=(name,width)=>{switch(width){case 4:return function(pointer){return this.fromWireType(HEAPF32[pointer>>>2>>>0])};case 8:return function(pointer){return this.fromWireType(HEAPF64[pointer>>>3>>>0])};default:throw new TypeError(`invalid float width (${width}): ${name}`)}};var __embind_register_float=function(rawType,name,size){rawType>>>=0;name>>>=0;size>>>=0;name=AsciiToString(name);registerType(rawType,{name,fromWireType:value=>value,toWireType:(destructors,value)=>value,readValueFromPointer:floatReadValueFromPointer(name,size),destructorFunction:null})};function usesDestructorStack(argTypes){for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){return true}}return false}function createJsInvoker(argTypes,isClassMethodFunc,returns,isAsync){var needsDestructorStack=usesDestructorStack(argTypes);var argCount=argTypes.length-2;var argsList=[];var argsListWired=["fn"];if(isClassMethodFunc){argsListWired.push("thisWired")}for(var i=0;i<argCount;++i){argsList.push(`arg${i}`);argsListWired.push(`arg${i}Wired`)}argsList=argsList.join(",");argsListWired=argsListWired.join(",");var invokerFnBody=`return function (${argsList}) {\n`;if(needsDestructorStack){invokerFnBody+="var destructors = [];\n"}var dtorStack=needsDestructorStack?"destructors":"null";var args1=["humanName","throwBindingError","invoker","fn","runDestructors","fromRetWire","toClassParamWire"];if(isClassMethodFunc){invokerFnBody+=`var thisWired = toClassParamWire(${dtorStack}, this);\n`}for(var i=0;i<argCount;++i){var argName=`toArg${i}Wire`;invokerFnBody+=`var arg${i}Wired = ${argName}(${dtorStack}, arg${i});\n`;args1.push(argName)}invokerFnBody+=(returns||isAsync?"var rv = ":"")+`invoker(${argsListWired});\n`;if(needsDestructorStack){invokerFnBody+="runDestructors(destructors);\n"}else{for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){var paramName=i===1?"thisWired":"arg"+(i-2)+"Wired";if(argTypes[i].destructorFunction!==null){invokerFnBody+=`${paramName}_dtor(${paramName});\n`;args1.push(`${paramName}_dtor`)}}}if(returns){invokerFnBody+="var ret = fromRetWire(rv);\n"+"return ret;\n"}else{}invokerFnBody+="}\n";return new Function(args1,invokerFnBody)}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=usesDestructorStack(argTypes);var returns=!argTypes[0].isVoid;var retType=argTypes[0];var instType=argTypes[1];var closureArgs=[humanName,throwBindingError,cppInvokerFunc,cppTargetFunc,runDestructors,retType.fromWireType.bind(retType),instType?.toWireType.bind(instType)];for(var i=2;i<argCount;++i){var argType=argTypes[i];closureArgs.push(argType.toWireType.bind(argType))}if(!needsDestructorStack){for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){if(argTypes[i].destructorFunction!==null){closureArgs.push(argTypes[i].destructorFunction)}}}let invokerFactory=createJsInvoker(argTypes,isClassMethodFunc,returns,isAsync);var invokerFn=invokerFactory(...closureArgs);return createNamedFunction(humanName,invokerFn)}var heap32VectorToArray=(count,firstElement)=>{var array=[];for(var i=0;i<count;i++){array.push(HEAPU32[firstElement+i*4>>>2>>>0])}return array};var getFunctionName=signature=>{signature=signature.trim();const argsIndex=signature.indexOf("(");if(argsIndex===-1)return signature;return signature.slice(0,argsIndex)};function __embind_register_function(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn,isAsync,isNonnullReturn){name>>>=0;rawArgTypesAddr>>>=0;signature>>>=0;rawInvoker>>>=0;fn>>>=0;var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=AsciiToString(name);name=getFunctionName(name);rawInvoker=embind__requireFunction(signature,rawInvoker,isAsync);exposePublicSymbol(name,function(){throwUnboundTypeError(`Cannot call ${name} due to unbound types`,argTypes)},argCount-1);whenDependentTypesAreResolved([],argTypes,argTypes=>{var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn,isAsync),argCount-1);return[]})}var __embind_register_integer=function(primitiveType,name,size,minRange,maxRange){primitiveType>>>=0;name>>>=0;size>>>=0;name=AsciiToString(name);const isUnsignedType=minRange===0;let fromWireType=value=>value;if(isUnsignedType){var bitshift=32-8*size;fromWireType=value=>value<<bitshift>>>bitshift;maxRange=fromWireType(maxRange)}registerType(primitiveType,{name,fromWireType,toWireType:(destructors,value)=>value,readValueFromPointer:integerReadValueFromPointer(name,size,minRange!==0),destructorFunction:null})};function __embind_register_memory_view(rawType,dataTypeIndex,name){rawType>>>=0;name>>>=0;var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){var size=HEAPU32[handle>>>2>>>0];var data=HEAPU32[handle+4>>>2>>>0];return new TA(HEAP8.buffer,data,size)}name=AsciiToString(name);registerType(rawType,{name,fromWireType:decodeMemoryView,readValueFromPointer:decodeMemoryView},{ignoreDuplicateRegistrations:true})}var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);function __embind_register_std_string(rawType,name){rawType>>>=0;name>>>=0;name=AsciiToString(name);var stdStringIsUTF8=true;registerType(rawType,{name,fromWireType(value){var length=HEAPU32[value>>>2>>>0];var payload=value+4;var str;if(stdStringIsUTF8){str=UTF8ToString(payload,length,true)}else{str="";for(var i=0;i<length;++i){str+=String.fromCharCode(HEAPU8[payload+i>>>0])}}_free(value);return str},toWireType(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value)}var length;var valueIsOfTypeString=typeof value=="string";if(!(valueIsOfTypeString||ArrayBuffer.isView(value)&&value.BYTES_PER_ELEMENT==1)){throwBindingError("Cannot pass non-string to std::string")}if(stdStringIsUTF8&&valueIsOfTypeString){length=lengthBytesUTF8(value)}else{length=value.length}var base=_malloc(4+length+1);var ptr=base+4;HEAPU32[base>>>2>>>0]=length;if(valueIsOfTypeString){if(stdStringIsUTF8){stringToUTF8(value,ptr,length+1)}else{for(var i=0;i<length;++i){var charCode=value.charCodeAt(i);if(charCode>255){_free(base);throwBindingError("String has UTF-16 code units that do not fit in 8 bits")}HEAPU8[ptr+i>>>0]=charCode}}}else{HEAPU8.set(value,ptr>>>0)}if(destructors!==null){destructors.push(_free,base)}return base},readValueFromPointer:readPointer,destructorFunction(ptr){_free(ptr)}})}var UTF16Decoder=globalThis.TextDecoder?new TextDecoder("utf-16le"):undefined;var UTF16ToString=(ptr,maxBytesToRead,ignoreNul)=>{var idx=ptr>>>1;var endIdx=findStringEnd(HEAPU16,idx,maxBytesToRead/2,ignoreNul);if(endIdx-idx>16&&UTF16Decoder)return UTF16Decoder.decode(HEAPU16.subarray(idx>>>0,endIdx>>>0));var str="";for(var i=idx;i<endIdx;++i){var codeUnit=HEAPU16[i>>>0];str+=String.fromCharCode(codeUnit)}return str};var stringToUTF16=(str,outPtr,maxBytesToWrite)=>{maxBytesToWrite??=2147483647;if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>>1>>>0]=codeUnit;outPtr+=2}HEAP16[outPtr>>>1>>>0]=0;return outPtr-startPtr};var lengthBytesUTF16=str=>str.length*2;var UTF32ToString=(ptr,maxBytesToRead,ignoreNul)=>{var str="";var startIdx=ptr>>>2;for(var i=0;!(i>=maxBytesToRead/4);i++){var utf32=HEAPU32[startIdx+i>>>0];if(!utf32&&!ignoreNul)break;str+=String.fromCodePoint(utf32)}return str};var stringToUTF32=(str,outPtr,maxBytesToWrite)=>{outPtr>>>=0;maxBytesToWrite??=2147483647;if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codePoint=str.codePointAt(i);if(codePoint>65535){i++}HEAP32[outPtr>>>2>>>0]=codePoint;outPtr+=4;if(outPtr+4>endPtr)break}HEAP32[outPtr>>>2>>>0]=0;return outPtr-startPtr};var lengthBytesUTF32=str=>{var len=0;for(var i=0;i<str.length;++i){var codePoint=str.codePointAt(i);if(codePoint>65535){i++}len+=4}return len};function __embind_register_std_wstring(rawType,charSize,name){rawType>>>=0;charSize>>>=0;name>>>=0;name=AsciiToString(name);var decodeString,encodeString,lengthBytesUTF;if(charSize===2){decodeString=UTF16ToString;encodeString=stringToUTF16;lengthBytesUTF=lengthBytesUTF16}else{decodeString=UTF32ToString;encodeString=stringToUTF32;lengthBytesUTF=lengthBytesUTF32}registerType(rawType,{name,fromWireType:value=>{var length=HEAPU32[value>>>2>>>0];var str=decodeString(value+4,length*charSize,true);_free(value);return str},toWireType:(destructors,value)=>{if(!(typeof value=="string")){throwBindingError(`Cannot pass non-string to C++ string type ${name}`)}var length=lengthBytesUTF(value);var ptr=_malloc(4+length+charSize);HEAPU32[ptr>>>2>>>0]=length/charSize;encodeString(value,ptr+4,length+charSize);if(destructors!==null){destructors.push(_free,ptr)}return ptr},readValueFromPointer:readPointer,destructorFunction(ptr){_free(ptr)}})}var __embind_register_void=function(rawType,name){rawType>>>=0;name>>>=0;name=AsciiToString(name);registerType(rawType,{isVoid:true,name,fromWireType:()=>undefined,toWireType:(destructors,o)=>undefined})};var emval_methodCallers=[];var emval_addMethodCaller=caller=>{var id=emval_methodCallers.length;emval_methodCallers.push(caller);return id};var emval_lookupTypes=(argCount,argTypes)=>{var a=new Array(argCount);for(var i=0;i<argCount;++i){a[i]=requireRegisteredType(HEAPU32[argTypes+i*4>>>2>>>0],`parameter ${i}`)}return a};var emval_returnValue=(toReturnWire,destructorsRef,handle)=>{var destructors=[];var result=toReturnWire(destructors,handle);if(destructors.length){HEAPU32[destructorsRef>>>2>>>0]=Emval.toHandle(destructors)}return result};var emval_symbols={};var getStringOrSymbol=address=>{var symbol=emval_symbols[address];if(symbol===undefined){return AsciiToString(address)}return symbol};var __emval_create_invoker=function(argCount,argTypesPtr,kind){argTypesPtr>>>=0;var GenericWireTypeSize=8;var[retType,...argTypes]=emval_lookupTypes(argCount,argTypesPtr);var toReturnWire=retType.toWireType.bind(retType);var argFromPtr=argTypes.map(type=>type.readValueFromPointer.bind(type));argCount--;var captures={toValue:Emval.toValue};var args=argFromPtr.map((argFromPtr,i)=>{var captureName=`argFromPtr${i}`;captures[captureName]=argFromPtr;return`${captureName}(args${i?"+"+i*GenericWireTypeSize:""})`});var functionBody;switch(kind){case 0:functionBody="toValue(handle)";break;case 2:functionBody="new (toValue(handle))";break;case 3:functionBody="";break;case 1:captures["getStringOrSymbol"]=getStringOrSymbol;functionBody="toValue(handle)[getStringOrSymbol(methodName)]";break}functionBody+=`(${args})`;if(!retType.isVoid){captures["toReturnWire"]=toReturnWire;captures["emval_returnValue"]=emval_returnValue;functionBody=`return emval_returnValue(toReturnWire, destructorsRef, ${functionBody})`}functionBody=`return function (handle, methodName, destructorsRef, args) {\n${functionBody}\n}`;var invokerFunction=new Function(Object.keys(captures),functionBody)(...Object.values(captures));var functionName=`methodCaller<(${argTypes.map(t=>t.name)}) => ${retType.name}>`;return emval_addMethodCaller(createNamedFunction(functionName,invokerFunction))};function __emval_incref(handle){handle>>>=0;if(handle>9){emval_handles[handle+1]+=1}}function __emval_invoke(caller,handle,methodName,destructorsRef,args){caller>>>=0;handle>>>=0;methodName>>>=0;destructorsRef>>>=0;args>>>=0;return emval_methodCallers[caller](handle,methodName,destructorsRef,args)}function __emval_new_array(){return Emval.toHandle([])}function __emval_new_cstring(v){v>>>=0;return Emval.toHandle(getStringOrSymbol(v))}function __emval_new_object(){return Emval.toHandle({})}function __emval_run_destructors(handle){handle>>>=0;var destructors=Emval.toValue(handle);runDestructors(destructors);__emval_decref(handle)}function __emval_set_property(handle,key,value){handle>>>=0;key>>>=0;value>>>=0;handle=Emval.toValue(handle);key=Emval.toValue(key);value=Emval.toValue(value);handle[key]=value}function __gmtime_js(time,tmPtr){time=bigintToI53Checked(time);tmPtr>>>=0;var date=new Date(time*1e3);HEAP32[tmPtr>>>2>>>0]=date.getUTCSeconds();HEAP32[tmPtr+4>>>2>>>0]=date.getUTCMinutes();HEAP32[tmPtr+8>>>2>>>0]=date.getUTCHours();HEAP32[tmPtr+12>>>2>>>0]=date.getUTCDate();HEAP32[tmPtr+16>>>2>>>0]=date.getUTCMonth();HEAP32[tmPtr+20>>>2>>>0]=date.getUTCFullYear()-1900;HEAP32[tmPtr+24>>>2>>>0]=date.getUTCDay();var start=Date.UTC(date.getUTCFullYear(),0,1,0,0,0,0);var yday=(date.getTime()-start)/(1e3*60*60*24)|0;HEAP32[tmPtr+28>>>2>>>0]=yday}var isLeapYear=year=>year%4===0&&(year%100!==0||year%400===0);var MONTH_DAYS_LEAP_CUMULATIVE=[0,31,60,91,121,152,182,213,244,274,305,335];var MONTH_DAYS_REGULAR_CUMULATIVE=[0,31,59,90,120,151,181,212,243,273,304,334];var ydayFromDate=date=>{var leap=isLeapYear(date.getFullYear());var monthDaysCumulative=leap?MONTH_DAYS_LEAP_CUMULATIVE:MONTH_DAYS_REGULAR_CUMULATIVE;var yday=monthDaysCumulative[date.getMonth()]+date.getDate()-1;return yday};var __mktime_js=function(tmPtr){tmPtr>>>=0;var ret=(()=>{var date=new Date(HEAP32[tmPtr+20>>>2>>>0]+1900,HEAP32[tmPtr+16>>>2>>>0],HEAP32[tmPtr+12>>>2>>>0],HEAP32[tmPtr+8>>>2>>>0],HEAP32[tmPtr+4>>>2>>>0],HEAP32[tmPtr>>>2>>>0],0);if(isNaN(date.getTime())){return-1}var dst=HEAP32[tmPtr+32>>>2>>>0];var guessedOffset=date.getTimezoneOffset();var start=new Date(date.getFullYear(),0,1);var summerOffset=new Date(date.getFullYear(),6,1).getTimezoneOffset();var winterOffset=start.getTimezoneOffset();var dstOffset=Math.min(winterOffset,summerOffset);if(dst<0){HEAP32[tmPtr+32>>>2>>>0]=Number(summerOffset!=winterOffset&&dstOffset==guessedOffset)}else if(dst>0!=(dstOffset==guessedOffset)){var nonDstOffset=Math.max(winterOffset,summerOffset);var trueOffset=dst>0?dstOffset:nonDstOffset;date.setTime(date.getTime()+(trueOffset-guessedOffset)*6e4)}HEAP32[tmPtr+24>>>2>>>0]=date.getDay();var yday=ydayFromDate(date)|0;HEAP32[tmPtr+28>>>2>>>0]=yday;HEAP32[tmPtr>>>2>>>0]=date.getSeconds();HEAP32[tmPtr+4>>>2>>>0]=date.getMinutes();HEAP32[tmPtr+8>>>2>>>0]=date.getHours();HEAP32[tmPtr+12>>>2>>>0]=date.getDate();HEAP32[tmPtr+16>>>2>>>0]=date.getMonth();HEAP32[tmPtr+20>>>2>>>0]=date.getYear();return date.getTime()/1e3})();return BigInt(ret)};var __tzset_js=function(timezone,daylight,std_name,dst_name){timezone>>>=0;daylight>>>=0;std_name>>>=0;dst_name>>>=0;var currentYear=(new Date).getFullYear();var winter=new Date(currentYear,0,1);var summer=new Date(currentYear,6,1);var winterOffset=winter.getTimezoneOffset();var summerOffset=summer.getTimezoneOffset();var stdTimezoneOffset=Math.max(winterOffset,summerOffset);HEAPU32[timezone>>>2>>>0]=stdTimezoneOffset*60;HEAP32[daylight>>>2>>>0]=Number(winterOffset!=summerOffset);var extractZone=timezoneOffset=>{var sign=timezoneOffset>=0?"-":"+";var absOffset=Math.abs(timezoneOffset);var hours=String(Math.floor(absOffset/60)).padStart(2,"0");var minutes=String(absOffset%60).padStart(2,"0");return`UTC${sign}${hours}${minutes}`};var winterName=extractZone(winterOffset);var summerName=extractZone(summerOffset);if(summerOffset<winterOffset){stringToUTF8(winterName,std_name,17);stringToUTF8(summerName,dst_name,17)}else{stringToUTF8(winterName,dst_name,17);stringToUTF8(summerName,std_name,17)}};var _emscripten_date_now=()=>Date.now();function _emscripten_err(str){str>>>=0;return err(UTF8ToString(str))}var _emscripten_get_now=()=>performance.now();var getHeapMax=()=>4294901760;var alignMemory=(size,alignment)=>Math.ceil(size/alignment)*alignment;var growMemory=size=>{var oldHeapSize=wasmMemory.buffer.byteLength;var pages=(size-oldHeapSize+65535)/65536|0;try{wasmMemory.grow(pages);updateMemoryViews();return 1}catch(e){}};function _emscripten_resize_heap(requestedSize){requestedSize>>>=0;var oldSize=HEAPU8.length;var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignMemory(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false}var ENV={};var getExecutableName=()=>thisProgram;var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8";var env={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:lang,_:getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`)}getEnvStrings.strings=strings}return getEnvStrings.strings};function _environ_get(__environ,environ_buf){__environ>>>=0;environ_buf>>>=0;var bufSize=0;var envp=0;for(var string of getEnvStrings()){var ptr=environ_buf+bufSize;HEAPU32[__environ+envp>>>2>>>0]=ptr;bufSize+=stringToUTF8(string,ptr,Infinity)+1;envp+=4}return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){penviron_count>>>=0;penviron_buf_size>>>=0;var strings=getEnvStrings();HEAPU32[penviron_count>>>2>>>0]=strings.length;var bufSize=0;for(var string of strings){bufSize+=lengthBytesUTF8(string)+1}HEAPU32[penviron_buf_size>>>2>>>0]=bufSize;return 0}function _fd_close(fd){try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doReadv=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>>2>>>0];var len=HEAPU32[iov+4>>>2>>>0];iov+=8;var curr=FS.read(stream,HEAP8,ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len)break;if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_read(fd,iov,iovcnt,pnum){iov>>>=0;iovcnt>>>=0;pnum>>>=0;try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doReadv(stream,iov,iovcnt);HEAPU32[pnum>>>2>>>0]=num;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_seek(fd,offset,whence,newOffset){offset=bigintToI53Checked(offset);newOffset>>>=0;try{if(isNaN(offset))return 22;var stream=SYSCALLS.getStreamFromFD(fd);FS.llseek(stream,offset,whence);HEAP64[newOffset>>>3>>>0]=BigInt(stream.position);if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doWritev=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>>2>>>0];var len=HEAPU32[iov+4>>>2>>>0];iov+=8;var curr=FS.write(stream,HEAP8,ptr,len,offset);if(curr<0)return-1;ret+=curr;if(curr<len){break}if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_write(fd,iov,iovcnt,pnum){iov>>>=0;iovcnt>>>=0;pnum>>>=0;try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doWritev(stream,iov,iovcnt);HEAPU32[pnum>>>2>>>0]=num;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _random_get(buffer,size){buffer>>>=0;size>>>=0;return randomFill(HEAPU8.subarray(buffer>>>0,buffer+size>>>0))}var getCFunc=ident=>{var func=Module["_"+ident];return func};var writeArrayToMemory=(array,buffer)=>{HEAP8.set(array,buffer>>>0)};var stackAlloc=sz=>__emscripten_stack_alloc(sz);var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};var ccall=(ident,returnType,argTypes,args,opts)=>{var toC={string:str=>{var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=stringToUTF8OnStack(str)}return ret},array:arr=>{var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string"){return UTF8ToString(ret)}if(returnType==="pointer")return ret>>>0;if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func(...cArgs);function onDone(ret){if(stack!==0)stackRestore(stack);return convertReturnValue(ret)}ret=onDone(ret);return ret};var cwrap=(ident,returnType,argTypes,opts)=>{var numericArgs=!argTypes||argTypes.every(type=>type==="number"||type==="boolean");var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return(...args)=>ccall(ident,returnType,argTypes,args,opts)};var stringToNewUTF8=str=>{var size=lengthBytesUTF8(str)+1;var ret=_malloc(size);if(ret)stringToUTF8(str,ret,size);return ret};FS.createPreloadedFile=FS_createPreloadedFile;FS.preloadFile=FS_preloadFile;FS.staticInit();init_ClassHandle();init_RegisteredPointer();{if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(Module["preloadPlugins"])preloadPlugins=Module["preloadPlugins"];if(Module["print"])out=Module["print"];if(Module["printErr"])err=Module["printErr"];if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(Module["arguments"])programArgs=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].shift()()}}}Module["ENV"]=ENV;Module["ccall"]=ccall;Module["cwrap"]=cwrap;Module["setValue"]=setValue;Module["UTF8ToString"]=UTF8ToString;Module["stringToNewUTF8"]=stringToNewUTF8;Module["FS"]=FS;var __Znwm,__ZdlPvm,_free,_malloc,_calloc,_realloc,___getTypeName,_strndup,__ZdaPv,__ZdaPvm,__ZdlPv,_emscripten_builtin_malloc,__Znam,__ZnamSt11align_val_t,__ZnwmSt11align_val_t,___libc_calloc,___libc_free,___libc_malloc,___libc_realloc,_emscripten_builtin_calloc,_emscripten_builtin_free,_emscripten_builtin_realloc,_malloc_size,_malloc_usable_size,_reallocf,__emscripten_stack_restore,__emscripten_stack_alloc,_emscripten_stack_get_current,memory,__indirect_function_table,wasmMemory,wasmTable;function assignWasmExports(wasmExports){__Znwm=Module["__Znwm"]=wasmExports["_Znwm"];__ZdlPvm=Module["__ZdlPvm"]=wasmExports["_ZdlPvm"];_free=wasmExports["free"];_malloc=wasmExports["malloc"];_calloc=wasmExports["calloc"];_realloc=wasmExports["realloc"];___getTypeName=wasmExports["__getTypeName"];_strndup=Module["_strndup"]=wasmExports["strndup"];__ZdaPv=Module["__ZdaPv"]=wasmExports["_ZdaPv"];__ZdaPvm=Module["__ZdaPvm"]=wasmExports["_ZdaPvm"];__ZdlPv=Module["__ZdlPv"]=wasmExports["_ZdlPv"];_emscripten_builtin_malloc=Module["_emscripten_builtin_malloc"]=wasmExports["emscripten_builtin_malloc"];__Znam=Module["__Znam"]=wasmExports["_Znam"];__ZnamSt11align_val_t=Module["__ZnamSt11align_val_t"]=wasmExports["_ZnamSt11align_val_t"];__ZnwmSt11align_val_t=Module["__ZnwmSt11align_val_t"]=wasmExports["_ZnwmSt11align_val_t"];___libc_calloc=Module["___libc_calloc"]=wasmExports["__libc_calloc"];___libc_free=Module["___libc_free"]=wasmExports["__libc_free"];___libc_malloc=Module["___libc_malloc"]=wasmExports["__libc_malloc"];___libc_realloc=Module["___libc_realloc"]=wasmExports["__libc_realloc"];_emscripten_builtin_calloc=Module["_emscripten_builtin_calloc"]=wasmExports["emscripten_builtin_calloc"];_emscripten_builtin_free=Module["_emscripten_builtin_free"]=wasmExports["emscripten_builtin_free"];_emscripten_builtin_realloc=Module["_emscripten_builtin_realloc"]=wasmExports["emscripten_builtin_realloc"];_malloc_size=Module["_malloc_size"]=wasmExports["malloc_size"];_malloc_usable_size=Module["_malloc_usable_size"]=wasmExports["malloc_usable_size"];_reallocf=Module["_reallocf"]=wasmExports["reallocf"];__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"];__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"];_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"];memory=wasmMemory=wasmExports["memory"];__indirect_function_table=wasmTable=wasmExports["__indirect_function_table"]}var wasmImports={__cxa_throw:___cxa_throw,__syscall_fcntl64:___syscall_fcntl64,__syscall_fstat64:___syscall_fstat64,__syscall_ioctl:___syscall_ioctl,__syscall_lstat64:___syscall_lstat64,__syscall_newfstatat:___syscall_newfstatat,__syscall_openat:___syscall_openat,__syscall_stat64:___syscall_stat64,_abort_js:__abort_js,_embind_register_bigint:__embind_register_bigint,_embind_register_bool:__embind_register_bool,_embind_register_class:__embind_register_class,_embind_register_class_property:__embind_register_class_property,_embind_register_emval:__embind_register_emval,_embind_register_enum:__embind_register_enum,_embind_register_enum_value:__embind_register_enum_value,_embind_register_float:__embind_register_float,_embind_register_function:__embind_register_function,_embind_register_integer:__embind_register_integer,_embind_register_memory_view:__embind_register_memory_view,_embind_register_std_string:__embind_register_std_string,_embind_register_std_wstring:__embind_register_std_wstring,_embind_register_void:__embind_register_void,_emval_create_invoker:__emval_create_invoker,_emval_decref:__emval_decref,_emval_incref:__emval_incref,_emval_invoke:__emval_invoke,_emval_new_array:__emval_new_array,_emval_new_cstring:__emval_new_cstring,_emval_new_object:__emval_new_object,_emval_run_destructors:__emval_run_destructors,_emval_set_property:__emval_set_property,_gmtime_js:__gmtime_js,_mktime_js:__mktime_js,_tzset_js:__tzset_js,emscripten_date_now:_emscripten_date_now,emscripten_err:_emscripten_err,emscripten_get_now:_emscripten_get_now,emscripten_resize_heap:_emscripten_resize_heap,environ_get:_environ_get,environ_sizes_get:_environ_sizes_get,fd_close:_fd_close,fd_read:_fd_read,fd_seek:_fd_seek,fd_write:_fd_write,random_get:_random_get};function applySignatureConversions(wasmExports){wasmExports=Object.assign({},wasmExports);var makeWrapper_pp=f=>a0=>f(a0)>>>0;var makeWrapper_ppp=f=>(a0,a1)=>f(a0,a1)>>>0;var makeWrapper_p=f=>()=>f()>>>0;wasmExports["malloc"]=makeWrapper_pp(wasmExports["malloc"]);wasmExports["calloc"]=makeWrapper_ppp(wasmExports["calloc"]);wasmExports["realloc"]=makeWrapper_ppp(wasmExports["realloc"]);wasmExports["__getTypeName"]=makeWrapper_pp(wasmExports["__getTypeName"]);wasmExports["emscripten_builtin_malloc"]=makeWrapper_pp(wasmExports["emscripten_builtin_malloc"]);wasmExports["emscripten_builtin_calloc"]=makeWrapper_ppp(wasmExports["emscripten_builtin_calloc"]);wasmExports["_emscripten_stack_alloc"]=makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);wasmExports["emscripten_stack_get_current"]=makeWrapper_p(wasmExports["emscripten_stack_get_current"]);return wasmExports}function run(){if(runDependencies>0){dependenciesFulfilled=run;return}preRun();if(runDependencies>0){dependenciesFulfilled=run;return}function doRun(){Module["calledRun"]=true;if(ABORT)return;initRuntime();readyPromiseResolve?.(Module);Module["onRuntimeInitialized"]?.();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(()=>{setTimeout(()=>Module["setStatus"](""),1);doRun()},1)}else{doRun()}}var wasmExports;wasmExports=await (createWasm());run();if(runtimeInitialized){moduleRtn=Module}else{moduleRtn=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject})}
;return moduleRtn}

const __dwgGlueDefault = createModule;
// ===== end: wasm 胶水层 =====

// ===== begin: ESM 包装层（已移除相对 import）=====
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const default2 = __dwgGlueDefault;
var DwgCodePage = /* @__PURE__ */ ((DwgCodePage2) => {
  DwgCodePage2[DwgCodePage2["CP_UTF8"] = 0] = "CP_UTF8";
  DwgCodePage2[DwgCodePage2["CP_US_ASCII"] = 1] = "CP_US_ASCII";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_1"] = 2] = "CP_ISO_8859_1";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_2"] = 3] = "CP_ISO_8859_2";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_3"] = 4] = "CP_ISO_8859_3";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_4"] = 5] = "CP_ISO_8859_4";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_5"] = 6] = "CP_ISO_8859_5";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_6"] = 7] = "CP_ISO_8859_6";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_7"] = 8] = "CP_ISO_8859_7";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_8"] = 9] = "CP_ISO_8859_8";
  DwgCodePage2[DwgCodePage2["CP_ISO_8859_9"] = 10] = "CP_ISO_8859_9";
  DwgCodePage2[DwgCodePage2["CP_CP437"] = 11] = "CP_CP437";
  DwgCodePage2[DwgCodePage2["CP_CP850"] = 12] = "CP_CP850";
  DwgCodePage2[DwgCodePage2["CP_CP852"] = 13] = "CP_CP852";
  DwgCodePage2[DwgCodePage2["CP_CP855"] = 14] = "CP_CP855";
  DwgCodePage2[DwgCodePage2["CP_CP857"] = 15] = "CP_CP857";
  DwgCodePage2[DwgCodePage2["CP_CP860"] = 16] = "CP_CP860";
  DwgCodePage2[DwgCodePage2["CP_CP861"] = 17] = "CP_CP861";
  DwgCodePage2[DwgCodePage2["CP_CP863"] = 18] = "CP_CP863";
  DwgCodePage2[DwgCodePage2["CP_CP864"] = 19] = "CP_CP864";
  DwgCodePage2[DwgCodePage2["CP_CP865"] = 20] = "CP_CP865";
  DwgCodePage2[DwgCodePage2["CP_CP869"] = 21] = "CP_CP869";
  DwgCodePage2[DwgCodePage2["CP_CP932"] = 22] = "CP_CP932";
  DwgCodePage2[DwgCodePage2["CP_MACINTOSH"] = 23] = "CP_MACINTOSH";
  DwgCodePage2[DwgCodePage2["CP_BIG5"] = 24] = "CP_BIG5";
  DwgCodePage2[DwgCodePage2["CP_CP949"] = 25] = "CP_CP949";
  DwgCodePage2[DwgCodePage2["CP_JOHAB"] = 26] = "CP_JOHAB";
  DwgCodePage2[DwgCodePage2["CP_CP866"] = 27] = "CP_CP866";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1250"] = 28] = "CP_ANSI_1250";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1251"] = 29] = "CP_ANSI_1251";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1252"] = 30] = "CP_ANSI_1252";
  DwgCodePage2[DwgCodePage2["CP_GB2312"] = 31] = "CP_GB2312";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1253"] = 32] = "CP_ANSI_1253";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1254"] = 33] = "CP_ANSI_1254";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1255"] = 34] = "CP_ANSI_1255";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1256"] = 35] = "CP_ANSI_1256";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1257"] = 36] = "CP_ANSI_1257";
  DwgCodePage2[DwgCodePage2["CP_ANSI_874"] = 37] = "CP_ANSI_874";
  DwgCodePage2[DwgCodePage2["CP_ANSI_932"] = 38] = "CP_ANSI_932";
  DwgCodePage2[DwgCodePage2["CP_ANSI_936"] = 39] = "CP_ANSI_936";
  DwgCodePage2[DwgCodePage2["CP_ANSI_949"] = 40] = "CP_ANSI_949";
  DwgCodePage2[DwgCodePage2["CP_ANSI_950"] = 41] = "CP_ANSI_950";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1361"] = 42] = "CP_ANSI_1361";
  DwgCodePage2[DwgCodePage2["CP_UTF16"] = 43] = "CP_UTF16";
  DwgCodePage2[DwgCodePage2["CP_ANSI_1258"] = 44] = "CP_ANSI_1258";
  DwgCodePage2[DwgCodePage2["CP_UNDEFINED"] = 255] = "CP_UNDEFINED";
  return DwgCodePage2;
})(DwgCodePage || {});
const encodings = [
  "utf-8",
  // 0
  "utf-8",
  // US ASCII
  "iso-8859-1",
  "iso-8859-2",
  "iso-8859-3",
  "iso-8859-4",
  "iso-8859-5",
  "iso-8859-6",
  "iso-8859-7",
  "iso-8859-8",
  "iso-8859-9",
  // 10
  "utf-8",
  // DOS English
  "utf-8",
  // 12 DOS Latin-1
  "utf-8",
  // DOS Central European
  "utf-8",
  // DOS Cyrillic
  "utf-8",
  // DOS Turkish
  "utf-8",
  // DOS Portoguese
  "utf-8",
  // DOS Icelandic
  "utf-8",
  // DOS Hebrew
  "utf-8",
  // DOS Arabic (IBM)
  "utf-8",
  // DOS Nordic
  "utf-8",
  // DOS Greek
  "shift-jis",
  // DOS Japanese (shiftjis)
  "macintosh",
  // 23
  "big5",
  // WHATWG 'euc-kr' decodes windows-949, which covers CP949 (Wansung + UHC).
  "euc-kr",
  // Korean (CP949 / Wansung + UHC)
  "utf-8",
  // Johab?
  "ibm866",
  // Russian
  "windows-1250",
  // Central + Eastern European
  "windows-1251",
  // Cyrillic
  "windows-1252",
  // Western European
  "gbk",
  // EUC-CN Chinese
  "windows-1253",
  // Greek
  "windows-1254",
  // Turkish
  "windows-1255",
  // Hebrew
  "windows-1256",
  // Arabic
  "windows-1257",
  // Baltic
  "windows-874",
  // Thai
  "shift-jis",
  // 38 Japanese (extended shiftjis, windows-31j)
  "gbk",
  // 39 Simplified Chinese
  "euc-kr",
  // 40 Korean Wansung
  "big5",
  // 41 Trad Chinese
  "utf-8",
  // 42 Korean Wansung
  "utf-16le",
  "windows-1258"
  // Vietnamese
];
const dwgCodePageToEncoding = (codepage) => {
  return encodings[codepage];
};
var DwgDimensionType = /* @__PURE__ */ ((DwgDimensionType2) => {
  DwgDimensionType2[DwgDimensionType2["Rotated"] = 0] = "Rotated";
  DwgDimensionType2[DwgDimensionType2["Aligned"] = 1] = "Aligned";
  DwgDimensionType2[DwgDimensionType2["Angular"] = 2] = "Angular";
  DwgDimensionType2[DwgDimensionType2["Diameter"] = 3] = "Diameter";
  DwgDimensionType2[DwgDimensionType2["Radius"] = 4] = "Radius";
  DwgDimensionType2[DwgDimensionType2["Angular3Point"] = 5] = "Angular3Point";
  DwgDimensionType2[DwgDimensionType2["Ordinate"] = 6] = "Ordinate";
  DwgDimensionType2[DwgDimensionType2["ReferenceIsExclusive"] = 32] = "ReferenceIsExclusive";
  DwgDimensionType2[DwgDimensionType2["IsOrdinateXTypeFlag"] = 64] = "IsOrdinateXTypeFlag";
  DwgDimensionType2[DwgDimensionType2["IsCustomTextPositionFlag"] = 128] = "IsCustomTextPositionFlag";
  return DwgDimensionType2;
})(DwgDimensionType || {});
var DwgAttachmentPoint = /* @__PURE__ */ ((DwgAttachmentPoint2) => {
  DwgAttachmentPoint2[DwgAttachmentPoint2["TopLeft"] = 1] = "TopLeft";
  DwgAttachmentPoint2[DwgAttachmentPoint2["TopCenter"] = 2] = "TopCenter";
  DwgAttachmentPoint2[DwgAttachmentPoint2["TopRight"] = 3] = "TopRight";
  DwgAttachmentPoint2[DwgAttachmentPoint2["MiddleLeft"] = 4] = "MiddleLeft";
  DwgAttachmentPoint2[DwgAttachmentPoint2["MiddleCenter"] = 5] = "MiddleCenter";
  DwgAttachmentPoint2[DwgAttachmentPoint2["MiddleRight"] = 6] = "MiddleRight";
  DwgAttachmentPoint2[DwgAttachmentPoint2["BottomLeft"] = 7] = "BottomLeft";
  DwgAttachmentPoint2[DwgAttachmentPoint2["BottomCenter"] = 8] = "BottomCenter";
  DwgAttachmentPoint2[DwgAttachmentPoint2["BottomRight"] = 9] = "BottomRight";
  return DwgAttachmentPoint2;
})(DwgAttachmentPoint || {});
var DwgDimensionTextLineSpacing = /* @__PURE__ */ ((DwgDimensionTextLineSpacing2) => {
  DwgDimensionTextLineSpacing2[DwgDimensionTextLineSpacing2["AtLeast"] = 1] = "AtLeast";
  DwgDimensionTextLineSpacing2[DwgDimensionTextLineSpacing2["Exact"] = 2] = "Exact";
  return DwgDimensionTextLineSpacing2;
})(DwgDimensionTextLineSpacing || {});
var DwgDimensionTextVertical = /* @__PURE__ */ ((DwgDimensionTextVertical2) => {
  DwgDimensionTextVertical2[DwgDimensionTextVertical2["Center"] = 0] = "Center";
  DwgDimensionTextVertical2[DwgDimensionTextVertical2["Above"] = 1] = "Above";
  DwgDimensionTextVertical2[DwgDimensionTextVertical2["Outside"] = 2] = "Outside";
  DwgDimensionTextVertical2[DwgDimensionTextVertical2["JIS"] = 3] = "JIS";
  DwgDimensionTextVertical2[DwgDimensionTextVertical2["Below"] = 4] = "Below";
  return DwgDimensionTextVertical2;
})(DwgDimensionTextVertical || {});
var DwgDimensionZeroSuppression = /* @__PURE__ */ ((DwgDimensionZeroSuppression2) => {
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["Feet"] = 0] = "Feet";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["None"] = 1] = "None";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["Inch"] = 2] = "Inch";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["FeetAndInch"] = 3] = "FeetAndInch";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["Leading"] = 4] = "Leading";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["Trailing"] = 8] = "Trailing";
  DwgDimensionZeroSuppression2[DwgDimensionZeroSuppression2["LeadingAndTrailing"] = 12] = "LeadingAndTrailing";
  return DwgDimensionZeroSuppression2;
})(DwgDimensionZeroSuppression || {});
var DwgDimensionZeroSuppressionAngular = /* @__PURE__ */ ((DwgDimensionZeroSuppressionAngular2) => {
  DwgDimensionZeroSuppressionAngular2[DwgDimensionZeroSuppressionAngular2["None"] = 0] = "None";
  DwgDimensionZeroSuppressionAngular2[DwgDimensionZeroSuppressionAngular2["Leading"] = 1] = "Leading";
  DwgDimensionZeroSuppressionAngular2[DwgDimensionZeroSuppressionAngular2["Trailing"] = 2] = "Trailing";
  DwgDimensionZeroSuppressionAngular2[DwgDimensionZeroSuppressionAngular2["LeadingAndTrailing"] = 3] = "LeadingAndTrailing";
  return DwgDimensionZeroSuppressionAngular2;
})(DwgDimensionZeroSuppressionAngular || {});
var DwgDimensionTextHorizontal = /* @__PURE__ */ ((DwgDimensionTextHorizontal2) => {
  DwgDimensionTextHorizontal2[DwgDimensionTextHorizontal2["Center"] = 0] = "Center";
  DwgDimensionTextHorizontal2[DwgDimensionTextHorizontal2["Left"] = 1] = "Left";
  DwgDimensionTextHorizontal2[DwgDimensionTextHorizontal2["Right"] = 2] = "Right";
  DwgDimensionTextHorizontal2[DwgDimensionTextHorizontal2["OverFirst"] = 3] = "OverFirst";
  DwgDimensionTextHorizontal2[DwgDimensionTextHorizontal2["OverSecond"] = 4] = "OverSecond";
  return DwgDimensionTextHorizontal2;
})(DwgDimensionTextHorizontal || {});
var DwgDimensionToleranceTextVertical = /* @__PURE__ */ ((DwgDimensionToleranceTextVertical2) => {
  DwgDimensionToleranceTextVertical2[DwgDimensionToleranceTextVertical2["Bottom"] = 0] = "Bottom";
  DwgDimensionToleranceTextVertical2[DwgDimensionToleranceTextVertical2["Center"] = 1] = "Center";
  DwgDimensionToleranceTextVertical2[DwgDimensionToleranceTextVertical2["Top"] = 2] = "Top";
  return DwgDimensionToleranceTextVertical2;
})(DwgDimensionToleranceTextVertical || {});
var DwgHatchSolidFill = /* @__PURE__ */ ((DwgHatchSolidFill2) => {
  DwgHatchSolidFill2[DwgHatchSolidFill2["PatternFill"] = 0] = "PatternFill";
  DwgHatchSolidFill2[DwgHatchSolidFill2["SolidFill"] = 1] = "SolidFill";
  return DwgHatchSolidFill2;
})(DwgHatchSolidFill || {});
var DwgHatchAssociativity = /* @__PURE__ */ ((DwgHatchAssociativity2) => {
  DwgHatchAssociativity2[DwgHatchAssociativity2["NonAssociative"] = 0] = "NonAssociative";
  DwgHatchAssociativity2[DwgHatchAssociativity2["Associative"] = 1] = "Associative";
  return DwgHatchAssociativity2;
})(DwgHatchAssociativity || {});
var DwgHatchStyle = /* @__PURE__ */ ((DwgHatchStyle2) => {
  DwgHatchStyle2[DwgHatchStyle2["Normal"] = 0] = "Normal";
  DwgHatchStyle2[DwgHatchStyle2["Outer"] = 1] = "Outer";
  DwgHatchStyle2[DwgHatchStyle2["Ignore"] = 2] = "Ignore";
  return DwgHatchStyle2;
})(DwgHatchStyle || {});
var DwgHatchPatternType = /* @__PURE__ */ ((DwgHatchPatternType2) => {
  DwgHatchPatternType2[DwgHatchPatternType2["UserDefined"] = 0] = "UserDefined";
  DwgHatchPatternType2[DwgHatchPatternType2["Predefined"] = 1] = "Predefined";
  DwgHatchPatternType2[DwgHatchPatternType2["Custom"] = 2] = "Custom";
  return DwgHatchPatternType2;
})(DwgHatchPatternType || {});
var DwgHatchBoundaryAnnotation = /* @__PURE__ */ ((DwgHatchBoundaryAnnotation2) => {
  DwgHatchBoundaryAnnotation2[DwgHatchBoundaryAnnotation2["NotAnnotated"] = 0] = "NotAnnotated";
  DwgHatchBoundaryAnnotation2[DwgHatchBoundaryAnnotation2["Annotated"] = 1] = "Annotated";
  return DwgHatchBoundaryAnnotation2;
})(DwgHatchBoundaryAnnotation || {});
var DwgHatchGradientFlag = /* @__PURE__ */ ((DwgHatchGradientFlag2) => {
  DwgHatchGradientFlag2[DwgHatchGradientFlag2["Solid"] = 0] = "Solid";
  DwgHatchGradientFlag2[DwgHatchGradientFlag2["Gradient"] = 1] = "Gradient";
  return DwgHatchGradientFlag2;
})(DwgHatchGradientFlag || {});
var DwgHatchGradientColorFlag = /* @__PURE__ */ ((DwgHatchGradientColorFlag2) => {
  DwgHatchGradientColorFlag2[DwgHatchGradientColorFlag2["TwoColor"] = 0] = "TwoColor";
  DwgHatchGradientColorFlag2[DwgHatchGradientColorFlag2["OneColor"] = 1] = "OneColor";
  return DwgHatchGradientColorFlag2;
})(DwgHatchGradientColorFlag || {});
var DwgBoundaryPathTypeFlag = /* @__PURE__ */ ((DwgBoundaryPathTypeFlag2) => {
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["Default"] = 0] = "Default";
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["External"] = 1] = "External";
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["Polyline"] = 2] = "Polyline";
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["Derived"] = 4] = "Derived";
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["Textbox"] = 8] = "Textbox";
  DwgBoundaryPathTypeFlag2[DwgBoundaryPathTypeFlag2["Outermost"] = 16] = "Outermost";
  return DwgBoundaryPathTypeFlag2;
})(DwgBoundaryPathTypeFlag || {});
var DwgBoundaryPathEdgeType = /* @__PURE__ */ ((DwgBoundaryPathEdgeType2) => {
  DwgBoundaryPathEdgeType2[DwgBoundaryPathEdgeType2["Line"] = 1] = "Line";
  DwgBoundaryPathEdgeType2[DwgBoundaryPathEdgeType2["Circular"] = 2] = "Circular";
  DwgBoundaryPathEdgeType2[DwgBoundaryPathEdgeType2["Elliptic"] = 3] = "Elliptic";
  DwgBoundaryPathEdgeType2[DwgBoundaryPathEdgeType2["Spline"] = 4] = "Spline";
  return DwgBoundaryPathEdgeType2;
})(DwgBoundaryPathEdgeType || {});
var DwgPolylineFlag = /* @__PURE__ */ ((DwgPolylineFlag2) => {
  DwgPolylineFlag2[DwgPolylineFlag2["CLOSED_POLYLINE"] = 1] = "CLOSED_POLYLINE";
  DwgPolylineFlag2[DwgPolylineFlag2["CURVE_FIT"] = 2] = "CURVE_FIT";
  DwgPolylineFlag2[DwgPolylineFlag2["SPLINE_FIT"] = 4] = "SPLINE_FIT";
  DwgPolylineFlag2[DwgPolylineFlag2["POLYLINE_3D"] = 8] = "POLYLINE_3D";
  DwgPolylineFlag2[DwgPolylineFlag2["POLYGON_3D"] = 16] = "POLYGON_3D";
  DwgPolylineFlag2[DwgPolylineFlag2["CLOSED_POLYGON"] = 32] = "CLOSED_POLYGON";
  DwgPolylineFlag2[DwgPolylineFlag2["POLYFACE"] = 64] = "POLYFACE";
  DwgPolylineFlag2[DwgPolylineFlag2["CONTINUOUS"] = 128] = "CONTINUOUS";
  return DwgPolylineFlag2;
})(DwgPolylineFlag || {});
var DwgSmoothType = /* @__PURE__ */ ((DwgSmoothType2) => {
  DwgSmoothType2[DwgSmoothType2["NONE"] = 0] = "NONE";
  DwgSmoothType2[DwgSmoothType2["QUADRATIC"] = 5] = "QUADRATIC";
  DwgSmoothType2[DwgSmoothType2["CUBIC"] = 6] = "CUBIC";
  DwgSmoothType2[DwgSmoothType2["BEZIER"] = 8] = "BEZIER";
  return DwgSmoothType2;
})(DwgSmoothType || {});
var DwgProxyOriginalDataFormat = /* @__PURE__ */ ((DwgProxyOriginalDataFormat2) => {
  DwgProxyOriginalDataFormat2[DwgProxyOriginalDataFormat2["Dwg"] = 0] = "Dwg";
  DwgProxyOriginalDataFormat2[DwgProxyOriginalDataFormat2["Dxf"] = 1] = "Dxf";
  return DwgProxyOriginalDataFormat2;
})(DwgProxyOriginalDataFormat || {});
var DwgTextGenerationFlag = /* @__PURE__ */ ((DwgTextGenerationFlag2) => {
  DwgTextGenerationFlag2[DwgTextGenerationFlag2["NONE"] = 0] = "NONE";
  DwgTextGenerationFlag2[DwgTextGenerationFlag2["MIRRORED_X"] = 2] = "MIRRORED_X";
  DwgTextGenerationFlag2[DwgTextGenerationFlag2["MIRRORED_Y"] = 4] = "MIRRORED_Y";
  return DwgTextGenerationFlag2;
})(DwgTextGenerationFlag || {});
var DwgTextHorizontalAlign = /* @__PURE__ */ ((DwgTextHorizontalAlign2) => {
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["LEFT"] = 0] = "LEFT";
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["CENTER"] = 1] = "CENTER";
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["RIGHT"] = 2] = "RIGHT";
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["ALIGNED"] = 3] = "ALIGNED";
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["MIDDLE"] = 4] = "MIDDLE";
  DwgTextHorizontalAlign2[DwgTextHorizontalAlign2["FIT"] = 5] = "FIT";
  return DwgTextHorizontalAlign2;
})(DwgTextHorizontalAlign || {});
var DwgTextVerticalAlign = /* @__PURE__ */ ((DwgTextVerticalAlign2) => {
  DwgTextVerticalAlign2[DwgTextVerticalAlign2["BASELINE"] = 0] = "BASELINE";
  DwgTextVerticalAlign2[DwgTextVerticalAlign2["BOTTOM"] = 1] = "BOTTOM";
  DwgTextVerticalAlign2[DwgTextVerticalAlign2["MIDDLE"] = 2] = "MIDDLE";
  DwgTextVerticalAlign2[DwgTextVerticalAlign2["TOP"] = 3] = "TOP";
  return DwgTextVerticalAlign2;
})(DwgTextVerticalAlign || {});
const HEADER_VARIABLES = Object.freeze([
  "ACADMAINTVER",
  "ACADVER",
  "ANGBASE",
  "ANGDIR",
  "ATTMODE",
  "AUNITS",
  "AUPREC",
  "CECOLOR",
  "CELTSCALE",
  "CELTYPE",
  "CELWEIGHT",
  "CEPSNID",
  "CEPSNTYPE",
  "CHAMFERA",
  "CHAMFERB",
  "CHAMFERC",
  "CHAMFERD",
  "CLAYER",
  "CMLJUST",
  "CMLSCALE",
  "CMLSTYLE",
  "CSHADOW",
  "DIMADEC",
  "DIMALT",
  "DIMALTD",
  "DIMALTF",
  "DIMALTRND",
  "DIMALTTD",
  "DIMALTTZ",
  "DIMALTU",
  "DIMALTZ",
  "DIMAPOST",
  "DIMASO",
  "DIMASSOC",
  "DIMASZ",
  "DIMATFIT",
  "DIMAUNIT",
  "DIMAZIN",
  "DIMBLK",
  "DIMBLK1",
  "DIMBLK2",
  "DIMCEN",
  "DIMCLRD",
  "DIMCLRE",
  "DIMCLRT",
  "DIMDEC",
  "DIMDLE",
  "DIMDLI",
  "DIMDSEP",
  "DIMEXE",
  "DIMEXO",
  "DIMFAC",
  "DIMGAP",
  "DIMJUST",
  "DIMLDRBLK",
  "DIMLFAC",
  "DIMLIM",
  "DIMLUNIT",
  "DIMLWD",
  "DIMLWE",
  "DIMPOST",
  "DIMRND",
  "DIMSAH",
  "DIMSCALE",
  "DIMSD1",
  "DIMSD2",
  "DIMSE1",
  "DIMSE2",
  "DIMSHO",
  "DIMSOXD",
  "DIMSTYLE",
  "DIMTAD",
  "DIMTDEC",
  "DIMTFAC",
  "DIMTIH",
  "DIMTIX",
  "DIMTM",
  "DIMTMOVE",
  "DIMTOFL",
  "DIMTOH",
  "DIMTOL",
  "DIMTOLJ",
  "DIMTP",
  "DIMTSZ",
  "DIMTVP",
  "DIMTXSTY",
  "DIMTXT",
  "DIMTZIN",
  "DIMUPT",
  "DIMZIN",
  "DISPSILH",
  "DRAGVS",
  "DWGCODEPAGE",
  "ELEVATION",
  "ENDCAPS",
  "EXTMAX",
  "EXTMIN",
  "EXTNAMES",
  "FILLETRAD",
  "FILLMODE",
  "FINGERPRINTGUID",
  "HALOGAP",
  "HANDSEED",
  "HIDETEXT",
  "HYPERLINKBASE",
  "INDEXCTL",
  "INSBASE",
  "INSUNITS",
  "INTERFERECOLOR",
  "INTERFEREOBJVS",
  "INTERFEREVPVS",
  "INTERSECTIONCOLOR",
  "INTERSECTIONDISPLAY",
  "JOINSTYLE",
  "LIMCHECK",
  "LIMMAX",
  "LIMMIN",
  "LTSCALE",
  "LUNITS",
  "LUPREC",
  "LWDISPLAY",
  "MAXACTVP",
  "MEASUREMENT",
  "MENU",
  "MIRRTEXT",
  "OBSCOLOR",
  "OBSLTYPE",
  "ORTHOMODE",
  "PDMODE",
  "PDSIZE",
  "PELEVATION",
  "PEXTMAX",
  "PEXTMIN",
  "PINSBASE",
  "PLIMCHECK",
  "PLIMMAX",
  "PLIMMIN",
  "PLINEGEN",
  "PLINEWID",
  "PROJECTNAME",
  "PROXYGRAPHICS",
  "PSLTSCALE",
  "PSTYLEMODE",
  "PSVPSCALE",
  "PUCSBASE",
  "PUCSNAME",
  "PUCSORG",
  "PUCSORGBACK",
  "PUCSORGBOTTOM",
  "PUCSORGFRONT",
  "PUCSORGLEFT",
  "PUCSORGRIGHT",
  "PUCSORGTOP",
  "PUCSORTHOREF",
  "PUCSORTHOVIEW",
  "PUCSXDIR",
  "PUCSYDIR",
  "QTEXTMODE",
  "REGENMODE",
  "SHADEDGE",
  "SHADEDIF",
  "SHADOWPLANELOCATION",
  "SKETCHINC",
  "SKPOLY",
  "SORTENTS",
  "SPLINESEGS",
  "SPLINETYPE",
  "SURFTAB1",
  "SURFTAB2",
  "SURFTYPE",
  "SURFU",
  "SURFV",
  "TDCREATE",
  "TDINDWG",
  "TDUCREATE",
  "TDUPDATE",
  "TDUSRTIMER",
  "TDUUPDATE",
  "TEXTSIZE",
  "TEXTSTYLE",
  "THICKNESS",
  "TILEMODE",
  "TRACEWID",
  "TREEDEPTH",
  "UCSBASE",
  "UCSNAME",
  "UCSORG",
  "UCSORGBACK",
  "UCSORGBOTTOM",
  "UCSORGFRONT",
  "UCSORGLEFT",
  "UCSORGRIGHT",
  "UCSORGTOP",
  "UCSORTHOREF",
  "UCSORTHOVIEW",
  "UCSXDIR",
  "UCSYDIR",
  "UNITMODE",
  "USERI1",
  "USERI2",
  "USERI3",
  "USERI4",
  "USERI5",
  "USERR1",
  "USERR2",
  "USERR3",
  "USERR4",
  "USERR5",
  "USRTIMER",
  "VERSIONGUID",
  "VISRETAIN",
  "WORLDVIEW",
  "XCLIPFRAME",
  "XEDIT"
]);
var DwgDictionaryCloningFlags = /* @__PURE__ */ ((DwgDictionaryCloningFlags2) => {
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["NotApplicable"] = 0] = "NotApplicable";
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["KeepExisting"] = 1] = "KeepExisting";
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["UseClone"] = 2] = "UseClone";
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["XrefName"] = 3] = "XrefName";
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["Name"] = 4] = "Name";
  DwgDictionaryCloningFlags2[DwgDictionaryCloningFlags2["UnmangleName"] = 5] = "UnmangleName";
  return DwgDictionaryCloningFlags2;
})(DwgDictionaryCloningFlags || {});
const UNICODE_ESCAPE = /\\U\+([0-9A-Fa-f]{4})/g;
function decodeUnicodeEscapes(text) {
  if (!text || !text.includes("\\U+")) {
    return text;
  }
  return text.replace(
    UNICODE_ESCAPE,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );
}
const dwgVersions = [
  {
    type: "invalid",
    hdr: "INVALI",
    description: "No DWG",
    version: 0
  },
  {
    type: "r1.1",
    hdr: "MC0.0",
    description: "MicroCAD Release 1.1",
    version: 0
  },
  {
    type: "r1.2",
    hdr: "AC1.2",
    description: "AutoCAD Release 1.2",
    version: 0
  },
  {
    type: "r1.3",
    hdr: "AC1.3",
    description: "AutoCAD Release 1.3",
    version: 1
  },
  {
    type: "r1.4",
    hdr: "AC1.40",
    description: "AutoCAD Release 1.4",
    version: 2
  },
  { type: "r2.0b", hdr: "AC1.50", description: "AutoCAD 2.0 beta", version: 3 },
  // not seen
  {
    type: "r2.0",
    hdr: "AC1.50",
    description: "AutoCAD Release 2.0",
    version: 4
  },
  {
    type: "r2.10",
    hdr: "AC2.10",
    description: "AutoCAD Release 2.10",
    version: 5
  },
  {
    type: "r2.21",
    hdr: "AC2.21",
    description: "AutoCAD Release 2.21",
    version: 6
  },
  {
    type: "r2.22",
    hdr: "AC2.22",
    description: "AutoCAD Release 2.22",
    version: 7
  },
  {
    type: "r2.4",
    hdr: "AC1001",
    description: "AutoCAD Release 2.4",
    version: 8
  },
  {
    type: "r2.5",
    hdr: "AC1002",
    description: "AutoCAD Release 2.5",
    version: 9
  },
  {
    type: "r2.6",
    hdr: "AC1003",
    description: "AutoCAD Release 2.6",
    version: 10
  },
  { type: "r9", hdr: "AC1004", description: "AutoCAD Release 9", version: 11 },
  {
    type: "r9c1",
    hdr: "AC1005",
    description: "AutoCAD Release 9c1",
    version: 12
  },
  {
    type: "r10",
    hdr: "AC1006",
    description: "AutoCAD Release 10",
    version: 13
  },
  {
    type: "r11b1",
    hdr: "AC1007",
    description: "AutoCAD 11 beta 1",
    version: 14
  },
  {
    type: "r11b2",
    hdr: "AC1008",
    description: "AutoCAD 11 beta 2",
    version: 15
  },
  {
    type: "r11",
    hdr: "AC1009",
    description: "AutoCAD Release 11/12 (LT R1/R2)",
    version: 16
  },
  {
    type: "r13b1",
    hdr: "AC1010",
    description: "AutoCAD pre-R13 a",
    version: 17
  },
  {
    type: "r13b2",
    hdr: "AC1011",
    description: "AutoCAD pre-R13 b",
    version: 18
  },
  {
    type: "r13",
    hdr: "AC1012",
    description: "AutoCAD Release 13",
    version: 19
  },
  {
    type: "r13c3",
    hdr: "AC1013",
    description: "AutoCAD Release 13c3",
    version: 20
  },
  {
    type: "r14",
    hdr: "AC1014",
    description: "AutoCAD Release 14",
    version: 21
  },
  {
    type: "r2000b",
    hdr: "AC1500",
    description: "AutoCAD 2000 beta",
    version: 22
  },
  {
    type: "r2000",
    hdr: "AC1015",
    description: "AutoCAD Release 2000",
    version: 23
  },
  {
    type: "r2000i",
    hdr: "AC1016",
    description: "AutoCAD Release 2000i",
    version: 23
  },
  {
    type: "r2002",
    hdr: "AC1017",
    description: "AutoCAD Release 2002",
    version: 23
  },
  {
    type: "r2004a",
    hdr: "AC402a",
    description: "AutoCAD 2004 alpha a",
    version: 24
  },
  {
    type: "r2004b",
    hdr: "AC402b",
    description: "AutoCAD 2004 alpha b",
    version: 24
  },
  {
    type: "r2004c",
    hdr: "AC1018",
    description: "AutoCAD 2004 beta",
    version: 24
  },
  // (includes versions AC1019/0x19 and AC1020/0x1a)
  {
    type: "r2004",
    hdr: "AC1018",
    description: "AutoCAD Release 2004",
    version: 25
  },
  //{ type: "r2005", hdr: "AC1019", description: "AutoCAD 2005", version: 0x19 }, // not seen
  //{ type: "r2006", hdr: "AC1020", description: "AutoCAD 2006", version: 0x19 }, // not seen
  {
    type: "r2007a",
    hdr: "AC701a",
    description: "AutoCAD 2007 alpha",
    version: 26
  },
  {
    type: "r2007b",
    hdr: "AC1021",
    description: "AutoCAD 2007 beta",
    version: 26
  },
  {
    type: "r2007",
    hdr: "AC1021",
    description: "AutoCAD Release 2007",
    version: 27
  },
  //{ type: "r2008", hdr: "AC1022", description: "AutoCAD 2008", version: 0x1b }, // not seen
  //{ type: "r2009", hdr: "AC1023", description: "AutoCAD 2009", version: 0x1b }, // not seen
  {
    type: "r2010b",
    hdr: "AC1024",
    description: "AutoCAD 2010 beta",
    version: 28
  },
  {
    type: "r2010",
    hdr: "AC1024",
    description: "AutoCAD Release 2010",
    version: 29
  },
  //{ type: "r2011", hdr: "AC1025", description: "AutoCAD 2011", version: 0x1d }, // not seen
  //{ type: "r2012", hdr: "AC1026", description: "AutoCAD 2012", version: 0x1e }, // not seen
  {
    type: "r2013b",
    hdr: "AC1027",
    description: "AutoCAD 2013 beta",
    version: 30
  },
  {
    type: "r2013",
    hdr: "AC1027",
    description: "AutoCAD Release 2013",
    version: 31
  },
  //{ type: "r2014", hdr: "AC1028", description: "AutoCAD 2014", version: 0x1f }, // not seen
  //{ type: "r2015", hdr: "AC1029", description: "AutoCAD 2015", version: 0x1f }, // not seen
  //{ type: "r2016", hdr: "AC1030", description: "AutoCAD 2016", version: 0x1f }, // not seen
  //{ type: "r2017", hdr: "AC1031", description: "AutoCAD 2017", version: 0x20 }, // not seen
  {
    type: "r2018b",
    hdr: "AC1032",
    description: "AutoCAD 2018 beta",
    version: 32
  },
  {
    type: "r2018",
    hdr: "AC1032",
    description: "AutoCAD Release 2018",
    version: 33
  },
  //{ type: "r2019", "AC1033", description: "AutoCAD Release 2019", version: 0x22 }, // not seen
  //{ type: "r2020", "AC1034", description: "AutoCAD Release 2020", version: 0x23 }, // not seen
  //{ type: "r2021", "AC1035", description: "AutoCAD Release 2021", version: 0x23 }, // not seen
  {
    type: "r2022b",
    hdr: "AC103-4",
    description: "AutoCAD 2022 beta",
    version: 36
  },
  { type: "r>2022", hdr: "", description: "AutoCAD Release >2022", version: 0 }
];
var Dwg_Object_Supertype = /* @__PURE__ */ ((Dwg_Object_Supertype2) => {
  Dwg_Object_Supertype2[Dwg_Object_Supertype2["DWG_SUPERTYPE_ENTITY"] = 0] = "DWG_SUPERTYPE_ENTITY";
  Dwg_Object_Supertype2[Dwg_Object_Supertype2["DWG_SUPERTYPE_OBJECT"] = 1] = "DWG_SUPERTYPE_OBJECT";
  return Dwg_Object_Supertype2;
})(Dwg_Object_Supertype || {});
var Dwg_Error = /* @__PURE__ */ ((Dwg_Error2) => {
  Dwg_Error2[Dwg_Error2["WRONGCRC"] = 1] = "WRONGCRC";
  Dwg_Error2[Dwg_Error2["NOTYETSUPPORTED"] = 2] = "NOTYETSUPPORTED";
  Dwg_Error2[Dwg_Error2["UNHANDLEDCLASS"] = 4] = "UNHANDLEDCLASS";
  Dwg_Error2[Dwg_Error2["INVALIDTYPE"] = 8] = "INVALIDTYPE";
  Dwg_Error2[Dwg_Error2["INVALIDHANDLE"] = 16] = "INVALIDHANDLE";
  Dwg_Error2[Dwg_Error2["INVALIDEED"] = 32] = "INVALIDEED";
  Dwg_Error2[Dwg_Error2["VALUEOUTOFBOUNDS"] = 64] = "VALUEOUTOFBOUNDS";
  Dwg_Error2[Dwg_Error2["CLASSESNOTFOUND"] = 128] = "CLASSESNOTFOUND";
  Dwg_Error2[Dwg_Error2["SECTIONNOTFOUND"] = 256] = "SECTIONNOTFOUND";
  Dwg_Error2[Dwg_Error2["PAGENOTFOUND"] = 512] = "PAGENOTFOUND";
  Dwg_Error2[Dwg_Error2["INTERNALERROR"] = 1024] = "INTERNALERROR";
  Dwg_Error2[Dwg_Error2["INVALIDDWG"] = 2048] = "INVALIDDWG";
  Dwg_Error2[Dwg_Error2["IOERROR"] = 4096] = "IOERROR";
  Dwg_Error2[Dwg_Error2["OUTOFMEM"] = 8192] = "OUTOFMEM";
  return Dwg_Error2;
})(Dwg_Error || {});
var Dwg_Object_Type = /* @__PURE__ */ ((Dwg_Object_Type2) => {
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_UNUSED"] = 0] = "DWG_TYPE_UNUSED";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TEXT"] = 1] = "DWG_TYPE_TEXT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ATTRIB"] = 2] = "DWG_TYPE_ATTRIB";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ATTDEF"] = 3] = "DWG_TYPE_ATTDEF";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCK"] = 4] = "DWG_TYPE_BLOCK";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ENDBLK"] = 5] = "DWG_TYPE_ENDBLK";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SEQEND"] = 6] = "DWG_TYPE_SEQEND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_INSERT"] = 7] = "DWG_TYPE_INSERT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MINSERT"] = 8] = "DWG_TYPE_MINSERT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VERTEX_2D"] = 10] = "DWG_TYPE_VERTEX_2D";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VERTEX_3D"] = 11] = "DWG_TYPE_VERTEX_3D";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VERTEX_MESH"] = 12] = "DWG_TYPE_VERTEX_MESH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VERTEX_PFACE"] = 13] = "DWG_TYPE_VERTEX_PFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VERTEX_PFACE_FACE"] = 14] = "DWG_TYPE_VERTEX_PFACE_FACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POLYLINE_2D"] = 15] = "DWG_TYPE_POLYLINE_2D";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POLYLINE_3D"] = 16] = "DWG_TYPE_POLYLINE_3D";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ARC"] = 17] = "DWG_TYPE_ARC";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CIRCLE"] = 18] = "DWG_TYPE_CIRCLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LINE"] = 19] = "DWG_TYPE_LINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_ORDINATE"] = 20] = "DWG_TYPE_DIMENSION_ORDINATE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_LINEAR"] = 21] = "DWG_TYPE_DIMENSION_LINEAR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_ALIGNED"] = 22] = "DWG_TYPE_DIMENSION_ALIGNED";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_ANG3PT"] = 23] = "DWG_TYPE_DIMENSION_ANG3PT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_ANG2LN"] = 24] = "DWG_TYPE_DIMENSION_ANG2LN";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_RADIUS"] = 25] = "DWG_TYPE_DIMENSION_RADIUS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMENSION_DIAMETER"] = 26] = "DWG_TYPE_DIMENSION_DIAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINT"] = 27] = "DWG_TYPE_POINT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_3DFACE"] = 28] = "DWG_TYPE_3DFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POLYLINE_PFACE"] = 29] = "DWG_TYPE_POLYLINE_PFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POLYLINE_MESH"] = 30] = "DWG_TYPE_POLYLINE_MESH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SOLID"] = 31] = "DWG_TYPE_SOLID";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TRACE"] = 32] = "DWG_TYPE_TRACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SHAPE"] = 33] = "DWG_TYPE_SHAPE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VIEWPORT"] = 34] = "DWG_TYPE_VIEWPORT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ELLIPSE"] = 35] = "DWG_TYPE_ELLIPSE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SPLINE"] = 36] = "DWG_TYPE_SPLINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_REGION"] = 37] = "DWG_TYPE_REGION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_3DSOLID"] = 38] = "DWG_TYPE_3DSOLID";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BODY"] = 39] = "DWG_TYPE_BODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RAY"] = 40] = "DWG_TYPE_RAY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_XLINE"] = 41] = "DWG_TYPE_XLINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DICTIONARY"] = 42] = "DWG_TYPE_DICTIONARY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_OLEFRAME"] = 43] = "DWG_TYPE_OLEFRAME";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MTEXT"] = 44] = "DWG_TYPE_MTEXT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LEADER"] = 45] = "DWG_TYPE_LEADER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TOLERANCE"] = 46] = "DWG_TYPE_TOLERANCE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MLINE"] = 47] = "DWG_TYPE_MLINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCK_CONTROL"] = 48] = "DWG_TYPE_BLOCK_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCK_HEADER"] = 49] = "DWG_TYPE_BLOCK_HEADER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYER_CONTROL"] = 50] = "DWG_TYPE_LAYER_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYER"] = 51] = "DWG_TYPE_LAYER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_STYLE_CONTROL"] = 52] = "DWG_TYPE_STYLE_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_STYLE"] = 53] = "DWG_TYPE_STYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LTYPE_CONTROL"] = 56] = "DWG_TYPE_LTYPE_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LTYPE"] = 57] = "DWG_TYPE_LTYPE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VIEW_CONTROL"] = 60] = "DWG_TYPE_VIEW_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VIEW"] = 61] = "DWG_TYPE_VIEW";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_UCS_CONTROL"] = 62] = "DWG_TYPE_UCS_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_UCS"] = 63] = "DWG_TYPE_UCS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VPORT_CONTROL"] = 64] = "DWG_TYPE_VPORT_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VPORT"] = 65] = "DWG_TYPE_VPORT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_APPID_CONTROL"] = 66] = "DWG_TYPE_APPID_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_APPID"] = 67] = "DWG_TYPE_APPID";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMSTYLE_CONTROL"] = 68] = "DWG_TYPE_DIMSTYLE_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMSTYLE"] = 69] = "DWG_TYPE_DIMSTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VX_CONTROL"] = 70] = "DWG_TYPE_VX_CONTROL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VX_TABLE_RECORD"] = 71] = "DWG_TYPE_VX_TABLE_RECORD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GROUP"] = 72] = "DWG_TYPE_GROUP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MLINESTYLE"] = 73] = "DWG_TYPE_MLINESTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_OLE2FRAME"] = 74] = "DWG_TYPE_OLE2FRAME";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DUMMY"] = 75] = "DWG_TYPE_DUMMY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LONG_TRANSACTION"] = 76] = "DWG_TYPE_LONG_TRANSACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LWPOLYLINE"] = 77] = "DWG_TYPE_LWPOLYLINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_HATCH"] = 78] = "DWG_TYPE_HATCH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_XRECORD"] = 79] = "DWG_TYPE_XRECORD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PLACEHOLDER"] = 80] = "DWG_TYPE_PLACEHOLDER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VBA_PROJECT"] = 81] = "DWG_TYPE_VBA_PROJECT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYOUT"] = 82] = "DWG_TYPE_LAYOUT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PROXY_ENTITY"] = 498] = "DWG_TYPE_PROXY_ENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PROXY_OBJECT"] = 499] = "DWG_TYPE_PROXY_OBJECT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACDSRECORD"] = 500] = "DWG_TYPE_ACDSRECORD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACDSSCHEMA"] = 501] = "DWG_TYPE_ACDSSCHEMA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACMECOMMANDHISTORY"] = 502] = "DWG_TYPE_ACMECOMMANDHISTORY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACMESCOPE"] = 503] = "DWG_TYPE_ACMESCOPE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACMESTATEMGR"] = 504] = "DWG_TYPE_ACMESTATEMGR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_BOOLEAN_CLASS"] = 505] = "DWG_TYPE_ACSH_BOOLEAN_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_BOX_CLASS"] = 506] = "DWG_TYPE_ACSH_BOX_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_BREP_CLASS"] = 507] = "DWG_TYPE_ACSH_BREP_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_CHAMFER_CLASS"] = 508] = "DWG_TYPE_ACSH_CHAMFER_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_CONE_CLASS"] = 509] = "DWG_TYPE_ACSH_CONE_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_CYLINDER_CLASS"] = 510] = "DWG_TYPE_ACSH_CYLINDER_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_EXTRUSION_CLASS"] = 511] = "DWG_TYPE_ACSH_EXTRUSION_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_FILLET_CLASS"] = 512] = "DWG_TYPE_ACSH_FILLET_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_HISTORY_CLASS"] = 513] = "DWG_TYPE_ACSH_HISTORY_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_LOFT_CLASS"] = 514] = "DWG_TYPE_ACSH_LOFT_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_PYRAMID_CLASS"] = 515] = "DWG_TYPE_ACSH_PYRAMID_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_REVOLVE_CLASS"] = 516] = "DWG_TYPE_ACSH_REVOLVE_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_SPHERE_CLASS"] = 517] = "DWG_TYPE_ACSH_SPHERE_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_SWEEP_CLASS"] = 518] = "DWG_TYPE_ACSH_SWEEP_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_TORUS_CLASS"] = 519] = "DWG_TYPE_ACSH_TORUS_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ACSH_WEDGE_CLASS"] = 520] = "DWG_TYPE_ACSH_WEDGE_CLASS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ALDIMOBJECTCONTEXTDATA"] = 521] = "DWG_TYPE_ALDIMOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ALIGNMENTPARAMETERENTITY"] = 522] = "DWG_TYPE_ALIGNMENTPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ANGDIMOBJECTCONTEXTDATA"] = 523] = "DWG_TYPE_ANGDIMOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ANNOTSCALEOBJECTCONTEXTDATA"] = 524] = "DWG_TYPE_ANNOTSCALEOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ARCALIGNEDTEXT"] = 525] = "DWG_TYPE_ARCALIGNEDTEXT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ARC_DIMENSION"] = 526] = "DWG_TYPE_ARC_DIMENSION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOC2DCONSTRAINTGROUP"] = 527] = "DWG_TYPE_ASSOC2DCONSTRAINTGROUP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOC3POINTANGULARDIMACTIONBODY"] = 528] = "DWG_TYPE_ASSOC3POINTANGULARDIMACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCACTION"] = 529] = "DWG_TYPE_ASSOCACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCACTIONPARAM"] = 530] = "DWG_TYPE_ASSOCACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCALIGNEDDIMACTIONBODY"] = 531] = "DWG_TYPE_ASSOCALIGNEDDIMACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYACTIONBODY"] = 532] = "DWG_TYPE_ASSOCARRAYACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYMODIFYACTIONBODY"] = 533] = "DWG_TYPE_ASSOCARRAYMODIFYACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYMODIFYPARAMETERS"] = 534] = "DWG_TYPE_ASSOCARRAYMODIFYPARAMETERS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYPATHPARAMETERS"] = 535] = "DWG_TYPE_ASSOCARRAYPATHPARAMETERS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYPOLARPARAMETERS"] = 536] = "DWG_TYPE_ASSOCARRAYPOLARPARAMETERS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCARRAYRECTANGULARPARAMETERS"] = 537] = "DWG_TYPE_ASSOCARRAYRECTANGULARPARAMETERS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCASMBODYACTIONPARAM"] = 538] = "DWG_TYPE_ASSOCASMBODYACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCBLENDSURFACEACTIONBODY"] = 539] = "DWG_TYPE_ASSOCBLENDSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCCOMPOUNDACTIONPARAM"] = 540] = "DWG_TYPE_ASSOCCOMPOUNDACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCDEPENDENCY"] = 541] = "DWG_TYPE_ASSOCDEPENDENCY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCDIMDEPENDENCYBODY"] = 542] = "DWG_TYPE_ASSOCDIMDEPENDENCYBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCEDGEACTIONPARAM"] = 543] = "DWG_TYPE_ASSOCEDGEACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCEDGECHAMFERACTIONBODY"] = 544] = "DWG_TYPE_ASSOCEDGECHAMFERACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCEDGEFILLETACTIONBODY"] = 545] = "DWG_TYPE_ASSOCEDGEFILLETACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCEXTENDSURFACEACTIONBODY"] = 546] = "DWG_TYPE_ASSOCEXTENDSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCEXTRUDEDSURFACEACTIONBODY"] = 547] = "DWG_TYPE_ASSOCEXTRUDEDSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCFACEACTIONPARAM"] = 548] = "DWG_TYPE_ASSOCFACEACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCFILLETSURFACEACTIONBODY"] = 549] = "DWG_TYPE_ASSOCFILLETSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCGEOMDEPENDENCY"] = 550] = "DWG_TYPE_ASSOCGEOMDEPENDENCY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCLOFTEDSURFACEACTIONBODY"] = 551] = "DWG_TYPE_ASSOCLOFTEDSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCMLEADERACTIONBODY"] = 552] = "DWG_TYPE_ASSOCMLEADERACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCNETWORK"] = 553] = "DWG_TYPE_ASSOCNETWORK";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCNETWORKSURFACEACTIONBODY"] = 554] = "DWG_TYPE_ASSOCNETWORKSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCOBJECTACTIONPARAM"] = 555] = "DWG_TYPE_ASSOCOBJECTACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCOFFSETSURFACEACTIONBODY"] = 556] = "DWG_TYPE_ASSOCOFFSETSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCORDINATEDIMACTIONBODY"] = 557] = "DWG_TYPE_ASSOCORDINATEDIMACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCOSNAPPOINTREFACTIONPARAM"] = 558] = "DWG_TYPE_ASSOCOSNAPPOINTREFACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCPATCHSURFACEACTIONBODY"] = 559] = "DWG_TYPE_ASSOCPATCHSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCPATHACTIONPARAM"] = 560] = "DWG_TYPE_ASSOCPATHACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCPERSSUBENTMANAGER"] = 561] = "DWG_TYPE_ASSOCPERSSUBENTMANAGER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCPLANESURFACEACTIONBODY"] = 562] = "DWG_TYPE_ASSOCPLANESURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCPOINTREFACTIONPARAM"] = 563] = "DWG_TYPE_ASSOCPOINTREFACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCRESTOREENTITYSTATEACTIONBODY"] = 564] = "DWG_TYPE_ASSOCRESTOREENTITYSTATEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCREVOLVEDSURFACEACTIONBODY"] = 565] = "DWG_TYPE_ASSOCREVOLVEDSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCROTATEDDIMACTIONBODY"] = 566] = "DWG_TYPE_ASSOCROTATEDDIMACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCSWEPTSURFACEACTIONBODY"] = 567] = "DWG_TYPE_ASSOCSWEPTSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCTRIMSURFACEACTIONBODY"] = 568] = "DWG_TYPE_ASSOCTRIMSURFACEACTIONBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCVALUEDEPENDENCY"] = 569] = "DWG_TYPE_ASSOCVALUEDEPENDENCY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCVARIABLE"] = 570] = "DWG_TYPE_ASSOCVARIABLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ASSOCVERTEXACTIONPARAM"] = 571] = "DWG_TYPE_ASSOCVERTEXACTIONPARAM";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BASEPOINTPARAMETERENTITY"] = 572] = "DWG_TYPE_BASEPOINTPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLKREFOBJECTCONTEXTDATA"] = 573] = "DWG_TYPE_BLKREFOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKALIGNEDCONSTRAINTPARAMETER"] = 574] = "DWG_TYPE_BLOCKALIGNEDCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKALIGNMENTGRIP"] = 575] = "DWG_TYPE_BLOCKALIGNMENTGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKALIGNMENTPARAMETER"] = 576] = "DWG_TYPE_BLOCKALIGNMENTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKANGULARCONSTRAINTPARAMETER"] = 577] = "DWG_TYPE_BLOCKANGULARCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKARRAYACTION"] = 578] = "DWG_TYPE_BLOCKARRAYACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKBASEPOINTPARAMETER"] = 579] = "DWG_TYPE_BLOCKBASEPOINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKDIAMETRICCONSTRAINTPARAMETER"] = 580] = "DWG_TYPE_BLOCKDIAMETRICCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKFLIPACTION"] = 581] = "DWG_TYPE_BLOCKFLIPACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKFLIPGRIP"] = 582] = "DWG_TYPE_BLOCKFLIPGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKFLIPPARAMETER"] = 583] = "DWG_TYPE_BLOCKFLIPPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKGRIPLOCATIONCOMPONENT"] = 584] = "DWG_TYPE_BLOCKGRIPLOCATIONCOMPONENT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKHORIZONTALCONSTRAINTPARAMETER"] = 585] = "DWG_TYPE_BLOCKHORIZONTALCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLINEARCONSTRAINTPARAMETER"] = 586] = "DWG_TYPE_BLOCKLINEARCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLINEARGRIP"] = 587] = "DWG_TYPE_BLOCKLINEARGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLINEARPARAMETER"] = 588] = "DWG_TYPE_BLOCKLINEARPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLOOKUPACTION"] = 589] = "DWG_TYPE_BLOCKLOOKUPACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLOOKUPGRIP"] = 590] = "DWG_TYPE_BLOCKLOOKUPGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKLOOKUPPARAMETER"] = 591] = "DWG_TYPE_BLOCKLOOKUPPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKMOVEACTION"] = 592] = "DWG_TYPE_BLOCKMOVEACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPARAMDEPENDENCYBODY"] = 593] = "DWG_TYPE_BLOCKPARAMDEPENDENCYBODY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPOINTPARAMETER"] = 594] = "DWG_TYPE_BLOCKPOINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPOLARGRIP"] = 595] = "DWG_TYPE_BLOCKPOLARGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPOLARPARAMETER"] = 596] = "DWG_TYPE_BLOCKPOLARPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPOLARSTRETCHACTION"] = 597] = "DWG_TYPE_BLOCKPOLARSTRETCHACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPROPERTIESTABLE"] = 598] = "DWG_TYPE_BLOCKPROPERTIESTABLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKPROPERTIESTABLEGRIP"] = 599] = "DWG_TYPE_BLOCKPROPERTIESTABLEGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKRADIALCONSTRAINTPARAMETER"] = 600] = "DWG_TYPE_BLOCKRADIALCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKREPRESENTATION"] = 601] = "DWG_TYPE_BLOCKREPRESENTATION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKROTATEACTION"] = 602] = "DWG_TYPE_BLOCKROTATEACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKROTATIONGRIP"] = 603] = "DWG_TYPE_BLOCKROTATIONGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKROTATIONPARAMETER"] = 604] = "DWG_TYPE_BLOCKROTATIONPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKSCALEACTION"] = 605] = "DWG_TYPE_BLOCKSCALEACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKSTRETCHACTION"] = 606] = "DWG_TYPE_BLOCKSTRETCHACTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKUSERPARAMETER"] = 607] = "DWG_TYPE_BLOCKUSERPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKVERTICALCONSTRAINTPARAMETER"] = 608] = "DWG_TYPE_BLOCKVERTICALCONSTRAINTPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKVISIBILITYGRIP"] = 609] = "DWG_TYPE_BLOCKVISIBILITYGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKVISIBILITYPARAMETER"] = 610] = "DWG_TYPE_BLOCKVISIBILITYPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKXYGRIP"] = 611] = "DWG_TYPE_BLOCKXYGRIP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BLOCKXYPARAMETER"] = 612] = "DWG_TYPE_BLOCKXYPARAMETER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CAMERA"] = 613] = "DWG_TYPE_CAMERA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CELLSTYLEMAP"] = 614] = "DWG_TYPE_CELLSTYLEMAP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CONTEXTDATAMANAGER"] = 615] = "DWG_TYPE_CONTEXTDATAMANAGER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CSACDOCUMENTOPTIONS"] = 616] = "DWG_TYPE_CSACDOCUMENTOPTIONS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_CURVEPATH"] = 617] = "DWG_TYPE_CURVEPATH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DATALINK"] = 618] = "DWG_TYPE_DATALINK";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DATATABLE"] = 619] = "DWG_TYPE_DATATABLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DBCOLOR"] = 620] = "DWG_TYPE_DBCOLOR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DETAILVIEWSTYLE"] = 621] = "DWG_TYPE_DETAILVIEWSTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DGNDEFINITION"] = 622] = "DWG_TYPE_DGNDEFINITION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DGNUNDERLAY"] = 623] = "DWG_TYPE_DGNUNDERLAY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DICTIONARYVAR"] = 624] = "DWG_TYPE_DICTIONARYVAR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DICTIONARYWDFLT"] = 625] = "DWG_TYPE_DICTIONARYWDFLT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DIMASSOC"] = 626] = "DWG_TYPE_DIMASSOC";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DMDIMOBJECTCONTEXTDATA"] = 627] = "DWG_TYPE_DMDIMOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DWFDEFINITION"] = 628] = "DWG_TYPE_DWFDEFINITION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DWFUNDERLAY"] = 629] = "DWG_TYPE_DWFUNDERLAY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DYNAMICBLOCKPROXYNODE"] = 630] = "DWG_TYPE_DYNAMICBLOCKPROXYNODE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_DYNAMICBLOCKPURGEPREVENTER"] = 631] = "DWG_TYPE_DYNAMICBLOCKPURGEPREVENTER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_EVALUATION_GRAPH"] = 632] = "DWG_TYPE_EVALUATION_GRAPH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_EXTRUDEDSURFACE"] = 633] = "DWG_TYPE_EXTRUDEDSURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FCFOBJECTCONTEXTDATA"] = 634] = "DWG_TYPE_FCFOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FIELD"] = 635] = "DWG_TYPE_FIELD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FIELDLIST"] = 636] = "DWG_TYPE_FIELDLIST";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FLIPPARAMETERENTITY"] = 637] = "DWG_TYPE_FLIPPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FLIPACTIONENTITY"] = 638] = "DWG_TYPE_FLIPACTIONENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GEODATA"] = 639] = "DWG_TYPE_GEODATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GEOMAPIMAGE"] = 640] = "DWG_TYPE_GEOMAPIMAGE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GEOPOSITIONMARKER"] = 641] = "DWG_TYPE_GEOPOSITIONMARKER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GRADIENT_BACKGROUND"] = 642] = "DWG_TYPE_GRADIENT_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_GROUND_PLANE_BACKGROUND"] = 643] = "DWG_TYPE_GROUND_PLANE_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_HELIX"] = 644] = "DWG_TYPE_HELIX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IBL_BACKGROUND"] = 645] = "DWG_TYPE_IBL_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IDBUFFER"] = 646] = "DWG_TYPE_IDBUFFER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IMAGE"] = 647] = "DWG_TYPE_IMAGE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IMAGEDEF"] = 648] = "DWG_TYPE_IMAGEDEF";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IMAGEDEF_REACTOR"] = 649] = "DWG_TYPE_IMAGEDEF_REACTOR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_IMAGE_BACKGROUND"] = 650] = "DWG_TYPE_IMAGE_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_INDEX"] = 651] = "DWG_TYPE_INDEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LARGE_RADIAL_DIMENSION"] = 652] = "DWG_TYPE_LARGE_RADIAL_DIMENSION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYERFILTER"] = 653] = "DWG_TYPE_LAYERFILTER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYER_INDEX"] = 654] = "DWG_TYPE_LAYER_INDEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LAYOUTPRINTCONFIG"] = 655] = "DWG_TYPE_LAYOUTPRINTCONFIG";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LEADEROBJECTCONTEXTDATA"] = 656] = "DWG_TYPE_LEADEROBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LIGHT"] = 657] = "DWG_TYPE_LIGHT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LIGHTLIST"] = 658] = "DWG_TYPE_LIGHTLIST";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LINEARPARAMETERENTITY"] = 659] = "DWG_TYPE_LINEARPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LOFTEDSURFACE"] = 660] = "DWG_TYPE_LOFTEDSURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MATERIAL"] = 661] = "DWG_TYPE_MATERIAL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MENTALRAYRENDERSETTINGS"] = 662] = "DWG_TYPE_MENTALRAYRENDERSETTINGS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MESH"] = 663] = "DWG_TYPE_MESH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MLEADEROBJECTCONTEXTDATA"] = 664] = "DWG_TYPE_MLEADEROBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MLEADERSTYLE"] = 665] = "DWG_TYPE_MLEADERSTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MOVEACTIONENTITY"] = 666] = "DWG_TYPE_MOVEACTIONENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MOTIONPATH"] = 667] = "DWG_TYPE_MOTIONPATH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MPOLYGON"] = 668] = "DWG_TYPE_MPOLYGON";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MTEXTATTRIBUTEOBJECTCONTEXTDATA"] = 669] = "DWG_TYPE_MTEXTATTRIBUTEOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MTEXTOBJECTCONTEXTDATA"] = 670] = "DWG_TYPE_MTEXTOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_MULTILEADER"] = 671] = "DWG_TYPE_MULTILEADER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_NAVISWORKSMODEL"] = 672] = "DWG_TYPE_NAVISWORKSMODEL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_NAVISWORKSMODELDEF"] = 673] = "DWG_TYPE_NAVISWORKSMODELDEF";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_NPOCOLLECTION"] = 674] = "DWG_TYPE_NPOCOLLECTION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_NURBSURFACE"] = 675] = "DWG_TYPE_NURBSURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_OBJECT_PTR"] = 676] = "DWG_TYPE_OBJECT_PTR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ORDDIMOBJECTCONTEXTDATA"] = 677] = "DWG_TYPE_ORDDIMOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PARTIAL_VIEWING_INDEX"] = 678] = "DWG_TYPE_PARTIAL_VIEWING_INDEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PDFDEFINITION"] = 679] = "DWG_TYPE_PDFDEFINITION";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PDFUNDERLAY"] = 680] = "DWG_TYPE_PDFUNDERLAY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PERSUBENTMGR"] = 681] = "DWG_TYPE_PERSUBENTMGR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PLANESURFACE"] = 682] = "DWG_TYPE_PLANESURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_PLOTSETTINGS"] = 683] = "DWG_TYPE_PLOTSETTINGS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUD"] = 684] = "DWG_TYPE_POINTCLOUD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDCOLORMAP"] = 685] = "DWG_TYPE_POINTCLOUDCOLORMAP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDDEF"] = 686] = "DWG_TYPE_POINTCLOUDDEF";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDDEFEX"] = 687] = "DWG_TYPE_POINTCLOUDDEFEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDDEF_REACTOR"] = 688] = "DWG_TYPE_POINTCLOUDDEF_REACTOR";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDDEF_REACTOR_EX"] = 689] = "DWG_TYPE_POINTCLOUDDEF_REACTOR_EX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTCLOUDEX"] = 690] = "DWG_TYPE_POINTCLOUDEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTPARAMETERENTITY"] = 691] = "DWG_TYPE_POINTPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POINTPATH"] = 692] = "DWG_TYPE_POINTPATH";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_POLARGRIPENTITY"] = 693] = "DWG_TYPE_POLARGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RADIMLGOBJECTCONTEXTDATA"] = 694] = "DWG_TYPE_RADIMLGOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RADIMOBJECTCONTEXTDATA"] = 695] = "DWG_TYPE_RADIMOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RAPIDRTRENDERSETTINGS"] = 696] = "DWG_TYPE_RAPIDRTRENDERSETTINGS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RASTERVARIABLES"] = 697] = "DWG_TYPE_RASTERVARIABLES";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RENDERENTRY"] = 698] = "DWG_TYPE_RENDERENTRY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RENDERENVIRONMENT"] = 699] = "DWG_TYPE_RENDERENVIRONMENT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RENDERGLOBAL"] = 700] = "DWG_TYPE_RENDERGLOBAL";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RENDERSETTINGS"] = 701] = "DWG_TYPE_RENDERSETTINGS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_REVOLVEDSURFACE"] = 702] = "DWG_TYPE_REVOLVEDSURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ROTATIONPARAMETERENTITY"] = 703] = "DWG_TYPE_ROTATIONPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ROTATEACTIONENTITY"] = 704] = "DWG_TYPE_ROTATEACTIONENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_RTEXT"] = 705] = "DWG_TYPE_RTEXT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SCALE"] = 706] = "DWG_TYPE_SCALE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SCALEACTIONENTITY"] = 707] = "DWG_TYPE_SCALEACTIONENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SECTIONOBJECT"] = 708] = "DWG_TYPE_SECTIONOBJECT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SECTIONVIEWSTYLE"] = 709] = "DWG_TYPE_SECTIONVIEWSTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SECTION_MANAGER"] = 710] = "DWG_TYPE_SECTION_MANAGER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SECTION_SETTINGS"] = 711] = "DWG_TYPE_SECTION_SETTINGS";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SKYLIGHT_BACKGROUND"] = 712] = "DWG_TYPE_SKYLIGHT_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SOLID_BACKGROUND"] = 713] = "DWG_TYPE_SOLID_BACKGROUND";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SORTENTSTABLE"] = 714] = "DWG_TYPE_SORTENTSTABLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SPATIAL_FILTER"] = 715] = "DWG_TYPE_SPATIAL_FILTER";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SPATIAL_INDEX"] = 716] = "DWG_TYPE_SPATIAL_INDEX";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_STRETCHACTIONENTITY"] = 717] = "DWG_TYPE_STRETCHACTIONENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SUN"] = 718] = "DWG_TYPE_SUN";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SUNSTUDY"] = 719] = "DWG_TYPE_SUNSTUDY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_SWEPTSURFACE"] = 720] = "DWG_TYPE_SWEPTSURFACE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TABLE"] = 721] = "DWG_TYPE_TABLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TABLECONTENT"] = 722] = "DWG_TYPE_TABLECONTENT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TABLEGEOMETRY"] = 723] = "DWG_TYPE_TABLEGEOMETRY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TABLESTYLE"] = 724] = "DWG_TYPE_TABLESTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TEXTOBJECTCONTEXTDATA"] = 725] = "DWG_TYPE_TEXTOBJECTCONTEXTDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_TVDEVICEPROPERTIES"] = 726] = "DWG_TYPE_TVDEVICEPROPERTIES";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VISIBILITYGRIPENTITY"] = 727] = "DWG_TYPE_VISIBILITYGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VISIBILITYPARAMETERENTITY"] = 728] = "DWG_TYPE_VISIBILITYPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_VISUALSTYLE"] = 729] = "DWG_TYPE_VISUALSTYLE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_WIPEOUT"] = 730] = "DWG_TYPE_WIPEOUT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_WIPEOUTVARIABLES"] = 731] = "DWG_TYPE_WIPEOUTVARIABLES";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_XREFPANELOBJECT"] = 732] = "DWG_TYPE_XREFPANELOBJECT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_XYPARAMETERENTITY"] = 733] = "DWG_TYPE_XYPARAMETERENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BREAKDATA"] = 734] = "DWG_TYPE_BREAKDATA";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_BREAKPOINTREF"] = 735] = "DWG_TYPE_BREAKPOINTREF";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FLIPGRIPENTITY"] = 736] = "DWG_TYPE_FLIPGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LINEARGRIPENTITY"] = 737] = "DWG_TYPE_LINEARGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ROTATIONGRIPENTITY"] = 738] = "DWG_TYPE_ROTATIONGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_XYGRIPENTITY"] = 739] = "DWG_TYPE_XYGRIPENTITY";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE__3DLINE"] = 740] = "DWG_TYPE__3DLINE";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_REPEAT"] = 741] = "DWG_TYPE_REPEAT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_ENDREP"] = 742] = "DWG_TYPE_ENDREP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_JUMP"] = 743] = "DWG_TYPE_JUMP";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_LOAD"] = 744] = "DWG_TYPE_LOAD";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_FREED"] = 65533] = "DWG_TYPE_FREED";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_UNKNOWN_ENT"] = 65534] = "DWG_TYPE_UNKNOWN_ENT";
  Dwg_Object_Type2[Dwg_Object_Type2["DWG_TYPE_UNKNOWN_OBJ"] = 65535] = "DWG_TYPE_UNKNOWN_OBJ";
  return Dwg_Object_Type2;
})(Dwg_Object_Type || {});
const Dwg_Object_Type_Inverted = Object.fromEntries(
  Object.entries(Dwg_Object_Type).map(([key, value]) => [value, key])
);
var Dwg_File_Type = /* @__PURE__ */ ((Dwg_File_Type2) => {
  Dwg_File_Type2[Dwg_File_Type2["DWG"] = 0] = "DWG";
  Dwg_File_Type2[Dwg_File_Type2["DXF"] = 1] = "DXF";
  return Dwg_File_Type2;
})(Dwg_File_Type || {});
var Dwg_Hatch_Edge_Type = /* @__PURE__ */ ((Dwg_Hatch_Edge_Type2) => {
  Dwg_Hatch_Edge_Type2[Dwg_Hatch_Edge_Type2["Line"] = 1] = "Line";
  Dwg_Hatch_Edge_Type2[Dwg_Hatch_Edge_Type2["CircularArc"] = 2] = "CircularArc";
  Dwg_Hatch_Edge_Type2[Dwg_Hatch_Edge_Type2["EllipticArc"] = 3] = "EllipticArc";
  Dwg_Hatch_Edge_Type2[Dwg_Hatch_Edge_Type2["Spline"] = 4] = "Spline";
  return Dwg_Hatch_Edge_Type2;
})(Dwg_Hatch_Edge_Type || {});
var Dwg_Color_Method = /* @__PURE__ */ ((Dwg_Color_Method2) => {
  Dwg_Color_Method2[Dwg_Color_Method2["ByLayer"] = 192] = "ByLayer";
  Dwg_Color_Method2[Dwg_Color_Method2["ByBlock"] = 193] = "ByBlock";
  Dwg_Color_Method2[Dwg_Color_Method2["Entities"] = 194] = "Entities";
  Dwg_Color_Method2[Dwg_Color_Method2["TrueColor"] = 195] = "TrueColor";
  Dwg_Color_Method2[Dwg_Color_Method2["ForegroundColor"] = 197] = "ForegroundColor";
  Dwg_Color_Method2[Dwg_Color_Method2["None"] = 200] = "None";
  return Dwg_Color_Method2;
})(Dwg_Color_Method || {});
const RAW_COLOR_TYPE_BY_LAYER = 192;
const RAW_COLOR_TYPE_BY_BLOCK = 193;
const RAW_COLOR_TYPE_RGB = 194;
const RAW_COLOR_TYPE_ACI = 195;
const RAW_COLOR_TYPE_WINDOW_BG = 200;
function dwgColorToMLeaderRawColor(color) {
  if (color == null) return void 0;
  const methodNum = color.method;
  const method = color.method != null && methodNum !== 0 ? methodNum : color.rgb >>> 24 & 255;
  const index = color.index;
  if (color.rgb != null && method >= RAW_COLOR_TYPE_BY_LAYER && method <= RAW_COLOR_TYPE_WINDOW_BG && (color.rgb >>> 24 & 255) === method) {
    return color.rgb >> 0;
  }
  if (method === Dwg_Color_Method.ByLayer || index === 256) {
    return RAW_COLOR_TYPE_BY_LAYER << 24 >> 0;
  }
  if (method === Dwg_Color_Method.ByBlock || index === 0) {
    return RAW_COLOR_TYPE_BY_BLOCK << 24 >> 0;
  }
  if (method === Dwg_Color_Method.None) {
    return RAW_COLOR_TYPE_WINDOW_BG << 24 >> 0;
  }
  if (method === Dwg_Color_Method.TrueColor) {
    const rgb = color.rgb != null ? color.rgb & 16777215 : void 0;
    if (rgb != null) {
      return (RAW_COLOR_TYPE_RGB << 24 | rgb) >> 0;
    }
  }
  if (method === Dwg_Color_Method.ForegroundColor) {
    return (RAW_COLOR_TYPE_ACI << 24 | 7) >> 0;
  }
  if (method === Dwg_Color_Method.Entities && index > 0 && index < 256) {
    return (RAW_COLOR_TYPE_ACI << 24 | index & 255) >> 0;
  }
  if (index > 0 && index < 256) {
    return (RAW_COLOR_TYPE_ACI << 24 | index & 255) >> 0;
  }
  return RAW_COLOR_TYPE_BY_BLOCK << 24 >> 0;
}
const MODEL_SPACE = "*MODEL_SPACE";
const MODEL_SPACE_PREFIX = "*PAPER_SPACE";
const isModelSpace = (name) => {
  return name && name.toUpperCase() == MODEL_SPACE;
};
const isPaperSpace = (name) => {
  return name && name.toUpperCase().startsWith(MODEL_SPACE_PREFIX);
};
const idToString = (id) => {
  return id.toString(16).toUpperCase();
};
const uint8ArrayToHexString = (bytes) => {
  const hexChars = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    hexChars[i] = bytes[i].toString(16).toUpperCase().padStart(2, "0");
  }
  return hexChars.join("");
};
const decodeOle2FrameCornersFromData = (data) => {
  if (!data || data.length < 98) {
    return null;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const readPoint = (offset) => ({
    x: view.getFloat64(offset, true),
    y: view.getFloat64(offset + 8, true),
    z: view.getFloat64(offset + 16, true)
  });
  const upperLeft = readPoint(2);
  const lowerRight = readPoint(2 + 48);
  if (![upperLeft.x, upperLeft.y, upperLeft.z, lowerRight.x, lowerRight.y, lowerRight.z].every(Number.isFinite)) {
    return null;
  }
  return { upperLeft, lowerRight };
};
class LibreEntityConverter {
  constructor(instance) {
    __publicField(this, "libredwg");
    __publicField(this, "layers", /* @__PURE__ */ new Map());
    __publicField(this, "ltypes", /* @__PURE__ */ new Map());
    __publicField(this, "classes", []);
    __publicField(this, "unknownEntityCount");
    this.libredwg = instance;
    this.unknownEntityCount = 0;
  }
  prepare(db, force = false) {
    if (force || this.layers.size == 0) {
      this.layers.clear();
      db.tables.LAYER.entries.forEach((layer) => {
        this.layers.set(layer.handle, layer.name);
      });
    }
    if (force || this.ltypes.size == 0) {
      this.ltypes.clear();
      db.tables.LTYPE.entries.forEach((ltype) => {
        this.ltypes.set(ltype.handle, ltype.name);
      });
    }
    this.classes = db.classes;
    this.unknownEntityCount = 0;
  }
  setClasses(classes) {
    this.classes = classes;
  }
  clear() {
    this.layers.clear();
    this.ltypes.clear();
    this.classes = [];
    this.unknownEntityCount = 0;
  }
  convert(object_ptr) {
    const libredwg = this.libredwg;
    const entity = libredwg.dwg_object_to_entity(object_ptr);
    const entity_tio = libredwg.dwg_object_to_entity_tio(object_ptr);
    if (entity && entity_tio) {
      const commonAttrs = this.getCommonAttrs(entity);
      const fixedtype = libredwg.dwg_object_get_fixedtype(object_ptr);
      if (fixedtype == Dwg_Object_Type.DWG_TYPE_3DFACE) {
        return this.convert3dFace(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_3DSOLID) {
        return this.convert3dSolid(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ARC) {
        return this.convertArc(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ATTDEF) {
        return this.convertAttdef(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_CIRCLE) {
        return this.convertCircle(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ALIGNED || fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_LINEAR) {
        return this.convertAlignedDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ANG3PT) {
        return this.convert3PointAngularDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ANG2LN) {
        return this.convert2LineAngularDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_DIAMETER) {
        return this.convertDiameterDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ORDINATE) {
        return this.convertOrdinateDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_RADIUS) {
        return this.convertRadiusDimension(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ELLIPSE) {
        return this.convertEllise(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_HATCH) {
        return this.convertHatch(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_IMAGE) {
        return this.convertImage(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_INSERT) {
        return this.convertInsert(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LEADER) {
        return this.convertLeader(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LINE) {
        return this.convertLine(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LWPOLYLINE) {
        return this.convertLWPolyline(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MLINE) {
        return this.convertMLine(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MULTILEADER) {
        return this.convertMultiLeader(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MTEXT) {
        return this.convertMText(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_OLE2FRAME) {
        return this.convertOle2Frame(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_OLEFRAME) {
        return this.convertOleFrame(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POINT) {
        return this.convertPoint(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POLYLINE_2D) {
        return this.convertPolyline2d(entity_tio, commonAttrs, object_ptr);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POLYLINE_3D) {
        return this.convertPolyline3d(entity_tio, commonAttrs, object_ptr);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_PROXY_ENTITY) {
        return this.convertProxyEntity(entity_tio, commonAttrs, object_ptr);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_RAY) {
        return this.convertRay(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SECTIONOBJECT) {
        return this.convertSection(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SHAPE) {
        return this.convertShape(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SOLID) {
        return this.convertSolid(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SPLINE) {
        return this.convertSpline(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TABLE) {
        return this.convertTable(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TEXT) {
        return this.convertText(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TOLERANCE) {
        return this.convertTolerance(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_VIEWPORT) {
        return this.convertViewport(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_WIPEOUT) {
        return this.convertWipeout(entity_tio, commonAttrs);
      } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_XLINE) {
        return this.convertXline(entity_tio, commonAttrs);
      } else if (fixedtype === Dwg_Object_Type.DWG_TYPE_UNKNOWN_ENT) {
        this.unknownEntityCount++;
      }
    }
    return void 0;
  }
  convert3dFace(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const corner1 = libredwg.dwg_dynapi_entity_data(entity, "corner1");
    const corner2 = libredwg.dwg_dynapi_entity_data(entity, "corner2");
    const corner3 = libredwg.dwg_dynapi_entity_data(entity, "corner3");
    const corner4 = libredwg.dwg_dynapi_entity_data(entity, "corner4");
    const flag = libredwg.dwg_dynapi_entity_data(entity, "invis_flags");
    return {
      type: "3DFACE",
      ...commonAttrs,
      corner1,
      corner2,
      corner3,
      corner4,
      flag
    };
  }
  convert3dSolid(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const version = libredwg.dwg_dynapi_entity_data(entity, "version");
    const satCache = libredwg.dwg_dynapi_entity_data(entity, "acis_empty");
    const data = libredwg.dwg_dynapi_entity_data(entity, "acis_data");
    const hasRevisionGuid = libredwg.dwg_dynapi_entity_data(
      entity,
      "has_revision_guid"
    );
    const historyRef = libredwg.dwg_dynapi_entity_data(entity, "history_id");
    const historyObjectSoftId = libredwg.dwg_ref_get_id(historyRef);
    const result = {
      type: "3DSOLID",
      subclassMarker: "AcDb3dSolid",
      ...commonAttrs
    };
    if (version) {
      result.version = version;
    }
    result.satCache = satCache;
    if (data) {
      result.data = data;
    }
    if (hasRevisionGuid) {
      const guidOffset = libredwg.dwg_dynapi_entity_field_offset(entity, "revision_guid");
      if (guidOffset >= 0) {
        const guid = libredwg.UTF8ToString(entity + guidOffset, 38);
        if (guid) {
          result.guid = guid;
        }
      }
    }
    if (historyObjectSoftId) {
      result.historyObjectSoftId = historyObjectSoftId;
    }
    return result;
  }
  convertArc(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const center = libredwg.dwg_dynapi_entity_data(entity, "center");
    const radius = libredwg.dwg_dynapi_entity_data(entity, "radius");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const startAngle = libredwg.dwg_dynapi_entity_data(entity, "start_angle");
    const endAngle = libredwg.dwg_dynapi_entity_data(entity, "end_angle");
    return {
      type: "ARC",
      ...commonAttrs,
      thickness,
      center,
      radius,
      startAngle,
      endAngle,
      extrusionDirection
    };
  }
  convertEmbeddedMText(entity, subclassName) {
    const libredwg = this.libredwg;
    const attachmentPoint = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "attachment");
    const insertionPoint = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "ins_pt");
    const direction = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "x_axis_dir");
    const rectHeight = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "rect_height");
    const rectWidth = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "rect_width");
    const extentsHeight = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "extents_height");
    const extentsWidth = libredwg.dwg_dynapi_subclass_data(entity, subclassName, "extents_width");
    return {
      insertionPoint,
      rectHeight,
      rectWidth,
      extentsHeight,
      extentsWidth,
      attachmentPoint,
      direction
      // columnType: columnType,
      // columnFlowReversed: columnFlowReversed,
      // columnAutoHeight: columnAutoHeight,
      // columnWidth: columnWidth,
      // columnGutter: columnGutter,
      // columnHeightCount: columnHeightCount,
      // columnHeights: columnHeights
    };
  }
  convertAttdef(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const textValue = libredwg.dwg_dynapi_entity_data(entity, "default_value");
    const text = this.convertTextBase(entity);
    text.text = textValue;
    const prompt = libredwg.dwg_dynapi_entity_data(entity, "prompt");
    const tag = libredwg.dwg_dynapi_entity_data(entity, "tag");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "flags");
    const fieldLength = libredwg.dwg_dynapi_entity_data(entity, "field_length");
    const lockPositionFlag = libredwg.dwg_dynapi_entity_data(entity, "lock_position_flag");
    const duplicateRecordCloningFlag = libredwg.dwg_dynapi_entity_data(entity, "keep_duplicate_records");
    const isReallyLocked = libredwg.dwg_dynapi_entity_data(entity, "is_really_locked");
    const mtextFlag = libredwg.dwg_dynapi_entity_data(entity, "mtext_type");
    const alignmentPoint = libredwg.dwg_dynapi_entity_data(entity, "alignment_pt");
    return {
      type: "ATTDEF",
      ...commonAttrs,
      text: this.convertTextBase(entity),
      prompt,
      tag,
      flags,
      fieldLength,
      lockPositionFlag: lockPositionFlag > 0,
      duplicateRecordCloningFlag: duplicateRecordCloningFlag > 0,
      mtextFlag,
      isReallyLocked: isReallyLocked > 0,
      alignmentPoint,
      annotationScale: 1,
      // TODO: Set the correct value
      attrTag: "",
      // TODO: Set the correct value
      mtext: this.convertEmbeddedMText(entity, "ATTDEF_mtext")
    };
  }
  convertAttrib(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const text = this.convertTextBase(entity);
    const tag = libredwg.dwg_dynapi_entity_data(entity, "tag");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "flags");
    const fieldLength = libredwg.dwg_dynapi_entity_data(entity, "field_length");
    const lockPositionFlag = libredwg.dwg_dynapi_entity_data(entity, "lock_position_flag");
    const duplicateRecordCloningFlag = libredwg.dwg_dynapi_entity_data(entity, "keep_duplicate_records");
    const mtextFlag = libredwg.dwg_dynapi_entity_data(entity, "mtext_type");
    const isReallyLocked = libredwg.dwg_dynapi_entity_data(entity, "is_really_locked");
    const alignmentPoint = libredwg.dwg_dynapi_entity_data(entity, "alignment_pt");
    return {
      type: "ATTRIB",
      ...commonAttrs,
      text,
      tag,
      flags,
      fieldLength,
      lockPositionFlag: !!lockPositionFlag,
      duplicateRecordCloningFlag: !!duplicateRecordCloningFlag,
      mtextFlag,
      isReallyLocked: !!isReallyLocked,
      numberOfSecondaryAttrs: 0,
      // TODO: libredwg doesn't support it yet.
      secondaryAttrsHardId: "0",
      // TODO: libredwg doesn't support it yet.
      alignmentPoint: { ...alignmentPoint, z: 0 },
      annotationScale: 1,
      // TODO: Set the correct value
      attrTag: "",
      // TODO: Set the correct value
      mtext: this.convertEmbeddedMText(entity, "ATTDEF_mtext")
    };
  }
  convertCircle(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const center = libredwg.dwg_dynapi_entity_data(entity, "center");
    const radius = libredwg.dwg_dynapi_entity_data(entity, "radius");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    return {
      type: "CIRCLE",
      ...commonAttrs,
      thickness,
      center,
      radius,
      extrusionDirection
    };
  }
  convertAlignedDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, "clone_ins_pt");
    const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, "xline1_pt");
    const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, "xline2_pt");
    const rotationAngle = libredwg.dwg_dynapi_entity_data(entity, "ins_rotation");
    const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, "oblique_angle");
    return {
      subclassMarker: "AcDbAlignedDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      insertionPoint,
      subDefinitionPoint1,
      subDefinitionPoint2,
      rotationAngle: rotationAngle == null ? 0 : rotationAngle,
      obliqueAngle
    };
  }
  convert3PointAngularDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, "xline1_pt");
    const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, "xline2_pt");
    const centerPoint = libredwg.dwg_dynapi_entity_data(entity, "center_pt");
    const arcPoint = libredwg.dwg_dynapi_entity_data(entity, "xline2end_pt");
    return {
      subclassMarker: "AcDb3PointAngularDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      subDefinitionPoint1,
      subDefinitionPoint2,
      centerPoint,
      arcPoint
    };
  }
  convert2LineAngularDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const xline1Start = libredwg.dwg_dynapi_entity_data(entity, "xline1start_pt");
    const xline1End = libredwg.dwg_dynapi_entity_data(entity, "xline1end_pt");
    const xline2Start = libredwg.dwg_dynapi_entity_data(entity, "xline2start_pt");
    const xline2End = libredwg.dwg_dynapi_entity_data(entity, "xline2end_pt");
    const vertexPoint = libredwg.dwg_dynapi_entity_data(entity, "def_pt");
    if (xline2End) {
      dimensionCommonAttrs.definitionPoint = xline2End;
    }
    return {
      subclassMarker: "AcDb2LineAngularDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      subDefinitionPoint1: xline1Start ?? xline1End ?? vertexPoint ?? xline2End,
      subDefinitionPoint2: xline2Start ?? xline2End ?? vertexPoint ?? xline1End,
      centerPoint: vertexPoint ?? xline2Start ?? xline1End ?? xline2End,
      arcPoint: xline2End ?? dimensionCommonAttrs.definitionPoint
    };
  }
  convertDiameterDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const centerPoint = libredwg.dwg_dynapi_entity_data(entity, "first_arc_pt");
    const leaderLength = libredwg.dwg_dynapi_entity_data(entity, "leader_len");
    return {
      subclassMarker: "AcDbDiametricDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      centerPoint,
      leaderLength
    };
  }
  convertOrdinateDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, "feature_location_pt");
    const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, "leader_endpt");
    return {
      subclassMarker: "AcDbOrdinateDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      subDefinitionPoint1,
      subDefinitionPoint2
    };
  }
  convertRadiusDimension(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
    const centerPoint = libredwg.dwg_dynapi_entity_data(entity, "first_arc_pt");
    const leaderLength = libredwg.dwg_dynapi_entity_data(entity, "leader_len");
    return {
      subclassMarker: "AcDbRadialDimension",
      ...commonAttrs,
      ...dimensionCommonAttrs,
      centerPoint,
      leaderLength
    };
  }
  convertEllise(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const center = libredwg.dwg_dynapi_entity_data(entity, "center");
    const majorAxisEndPoint = libredwg.dwg_dynapi_entity_data(entity, "sm_axis");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const axisRatio = libredwg.dwg_dynapi_entity_data(entity, "axis_ratio");
    const startAngle = libredwg.dwg_dynapi_entity_data(entity, "start_angle");
    const endAngle = libredwg.dwg_dynapi_entity_data(entity, "end_angle");
    return {
      type: "ELLIPSE",
      ...commonAttrs,
      center,
      majorAxisEndPoint,
      extrusionDirection,
      axisRatio,
      startAngle,
      endAngle
    };
  }
  convertHatch(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const patternName = libredwg.dwg_dynapi_entity_data(entity, "name");
    const isSolidFill = libredwg.dwg_dynapi_entity_data(entity, "is_solid_fill");
    const isAssociative = libredwg.dwg_dynapi_entity_data(entity, "is_associative");
    const numberOfBoundaryPaths = libredwg.dwg_dynapi_entity_data(entity, "num_paths");
    const paths_ptr = libredwg.dwg_dynapi_entity_data(entity, "paths");
    const boundaryPaths = libredwg.dwg_ptr_to_hatch_path_array(
      paths_ptr,
      numberOfBoundaryPaths
    );
    const patternStyle = libredwg.dwg_dynapi_entity_data(entity, "style");
    const patternType = libredwg.dwg_dynapi_entity_data(entity, "pattern_type");
    const patternAngle = libredwg.dwg_dynapi_entity_data(entity, "angle");
    const patternScale = libredwg.dwg_dynapi_entity_data(entity, "scale_spacing");
    const numberOfDefinitionLines = libredwg.dwg_dynapi_entity_data(entity, "num_deflines");
    const definitionLines_ptr = libredwg.dwg_dynapi_entity_data(entity, "deflines");
    const definitionLines = libredwg.dwg_ptr_to_hatch_defline_array(
      definitionLines_ptr,
      numberOfDefinitionLines
    );
    const pixelSize = libredwg.dwg_dynapi_entity_data(entity, "pixel_size");
    const numberOfSeedPoints = libredwg.dwg_dynapi_entity_data(entity, "num_seeds");
    const seedPoints_ptr = libredwg.dwg_dynapi_entity_data(entity, "seeds");
    const seedPoints = libredwg.dwg_ptr_to_point2d_array(
      seedPoints_ptr,
      numberOfSeedPoints
    );
    const result = {
      ...commonAttrs,
      // elevationPoint: DwgPoint3D
      extrusionDirection,
      patternName,
      solidFill: isSolidFill ? DwgHatchSolidFill.SolidFill : DwgHatchSolidFill.PatternFill,
      // patternFillColor: number
      associativity: isAssociative ? DwgHatchAssociativity.Associative : DwgHatchAssociativity.NonAssociative,
      numberOfBoundaryPaths,
      boundaryPaths: this.convertHatchBoundaryPaths(boundaryPaths),
      hatchStyle: patternStyle,
      patternType,
      patternAngle,
      patternScale,
      numberOfDefinitionLines,
      definitionLines: definitionLines.map((value) => {
        return {
          angle: value.angle,
          base: value.pt0,
          offset: value.offset,
          numberOfDashLengths: value.dashes.length,
          dashLengths: value.dashes
        };
      }),
      pixelSize,
      numberOfSeedPoints,
      // offsetVector?: DwgPoint3D
      seedPoints
      // gradientFlag?: DwgHatchGradientFlag
    };
    const gradientFlag = libredwg.dwg_dynapi_entity_data(entity, "is_gradient_fill");
    if (gradientFlag > 0) {
      const gradientName = libredwg.dwg_dynapi_entity_data(entity, "gradient_name");
      const gradientRotation = libredwg.dwg_dynapi_entity_data(entity, "gradient_angle");
      const gradientDefinition = libredwg.dwg_dynapi_entity_data(entity, "gradient_shift");
      const colorTint = libredwg.dwg_dynapi_entity_data(entity, "gradient_tint");
      const gradientColorFlag = libredwg.dwg_dynapi_entity_data(entity, "single_color_gradient");
      const gradientColors_ptr = libredwg.dwg_dynapi_entity_data(entity, "colors");
      const gradientColors = libredwg.dwg_ptr_to_hatch_gradient_color_array(gradientColors_ptr, gradientColorFlag == 1 ? 1 : 2);
      return {
        type: "HATCH",
        ...result,
        gradientFlag: DwgHatchGradientFlag.Gradient,
        gradientColorFlag: gradientColorFlag == 1 ? DwgHatchGradientColorFlag.OneColor : DwgHatchGradientColorFlag.TwoColor,
        gradientName,
        gradientRotation,
        gradientDefinition,
        colorTint,
        gradientColors
      };
    } else {
      return {
        type: "HATCH",
        ...result
      };
    }
  }
  convertHatchBoundaryPaths(paths) {
    const converted = paths.filter((path) => path.num_segs_or_paths > 0).map((path) => {
      const commonAttrs = {
        boundaryPathTypeFlag: path.flag
      };
      if (path.flag & 2) {
        return {
          ...commonAttrs,
          hasBulge: path.bulges_present,
          isClosed: path.closed,
          numberOfVertices: path.num_segs_or_paths,
          vertices: path.polyline_paths.map((vertex) => {
            return {
              x: vertex.point.x,
              y: vertex.point.y,
              bulge: vertex.bulge
            };
          })
        };
      } else {
        const edges = path.segs.map((seg) => {
          if (seg.curve_type == Dwg_Hatch_Edge_Type.Line) {
            return {
              type: DwgBoundaryPathEdgeType.Line,
              start: seg.first_endpoint,
              end: seg.second_endpoint
            };
          } else if (seg.curve_type == Dwg_Hatch_Edge_Type.CircularArc) {
            return {
              type: DwgBoundaryPathEdgeType.Circular,
              center: seg.center,
              radius: seg.radius,
              startAngle: seg.start_angle,
              endAngle: seg.end_angle,
              isCCW: seg.is_ccw
            };
          } else if (seg.curve_type == Dwg_Hatch_Edge_Type.EllipticArc) {
            return {
              type: DwgBoundaryPathEdgeType.Elliptic,
              center: seg.center,
              end: seg.endpoint,
              lengthOfMinorAxis: seg.minor_major_ratio,
              startAngle: seg.start_angle,
              endAngle: seg.end_angle,
              isCCW: seg.is_ccw
            };
          } else if (seg.curve_type == Dwg_Hatch_Edge_Type.Spline) {
            return {
              type: DwgBoundaryPathEdgeType.Spline,
              degree: seg.degree,
              isRational: seg.is_rational,
              isPeriodic: seg.is_periodic,
              numberOfKnots: seg.num_knots,
              numberOfControlPoints: seg.num_control_points,
              knots: seg.knots,
              controlPoints: seg.control_points,
              numberOfFitData: seg.num_fitpts,
              fitDatum: seg.fitpts,
              startTangent: seg.start_tangent,
              endTangent: seg.end_tangent
            };
          }
        });
        return {
          ...commonAttrs,
          numberOfEdges: path.num_segs_or_paths,
          edges
        };
      }
    });
    return converted;
  }
  convertImage(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const version = libredwg.dwg_dynapi_entity_data(entity, "class_version");
    const position = libredwg.dwg_dynapi_entity_data(entity, "pt0");
    const uPixel = libredwg.dwg_dynapi_entity_data(entity, "uvec");
    const vPixel = libredwg.dwg_dynapi_entity_data(entity, "vvec");
    const imageSize = libredwg.dwg_dynapi_entity_data(entity, "image_size");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "display_props");
    const clipping = libredwg.dwg_dynapi_entity_data(entity, "clipping");
    const brightness = libredwg.dwg_dynapi_entity_data(entity, "brightness");
    const contrast = libredwg.dwg_dynapi_entity_data(entity, "contrast");
    const fade = libredwg.dwg_dynapi_entity_data(entity, "fade");
    const clipMode = libredwg.dwg_dynapi_entity_data(entity, "clip_mode");
    const clippingBoundaryType = libredwg.dwg_dynapi_entity_data(entity, "clip_boundary_type");
    const countBoundaryPoints = libredwg.dwg_dynapi_entity_data(entity, "num_clip_verts");
    const clip_verts = libredwg.dwg_dynapi_entity_data(entity, "clip_verts");
    const clippingBoundaryPath = libredwg.dwg_ptr_to_point3d_array(
      clip_verts,
      countBoundaryPoints
    );
    const imagedef_ref = libredwg.dwg_dynapi_entity_data(entity, "imagedef");
    const imageDefHandle = libredwg.dwg_ref_get_id(imagedef_ref) ?? "";
    const imagedefreactor_ref = libredwg.dwg_dynapi_entity_data(entity, "imagedefreactor");
    const imageDefReactorHandle = libredwg.dwg_ref_get_id(imagedefreactor_ref) ?? "";
    return {
      type: "IMAGE",
      ...commonAttrs,
      version,
      position,
      uPixel,
      vPixel,
      imageSize,
      imageDefHandle,
      flags,
      clipping,
      brightness,
      contrast,
      fade,
      imageDefReactorHandle,
      clippingBoundaryType,
      countBoundaryPoints,
      clippingBoundaryPath,
      clipMode
    };
  }
  convertInsert(entity, commonAttrs) {
    const libredwg = this.libredwg;
    let name = "";
    const block_header_ref = libredwg.dwg_dynapi_entity_data(entity, "block_header");
    if (block_header_ref) {
      const block_header_obj = libredwg.dwg_ref_get_object(block_header_ref);
      if (block_header_obj) {
        const block_header_tio = libredwg.dwg_object_to_object_tio(block_header_obj);
        if (block_header_tio) {
          name = libredwg.dwg_entity_block_header_get_block(block_header_tio).name;
        }
      }
    }
    if (!name) {
      name = libredwg.dwg_dynapi_entity_data(entity, "block_name");
    }
    const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const scale = libredwg.dwg_dynapi_entity_data(entity, "scale");
    const rotation = libredwg.dwg_dynapi_entity_data(entity, "rotation");
    const columnCount = libredwg.dwg_dynapi_entity_data(entity, "num_cols");
    const rowCount = libredwg.dwg_dynapi_entity_data(entity, "num_rows");
    const columnSpacing = libredwg.dwg_dynapi_entity_data(entity, "col_spacing");
    const rowSpacing = libredwg.dwg_dynapi_entity_data(entity, "row_spacing");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const attrib_ptr_array = libredwg.dwg_entity_insert_get_attribs(entity);
    const attribs = [];
    attrib_ptr_array.forEach((object_ptr) => {
      const entity2 = libredwg.dwg_object_to_entity(object_ptr);
      const entity_tio = libredwg.dwg_object_to_entity_tio(object_ptr);
      if (entity2 && entity_tio) {
        const commonAttrs2 = this.getCommonAttrs(entity2);
        const fixedtype = libredwg.dwg_object_get_fixedtype(object_ptr);
        if (fixedtype == Dwg_Object_Type.DWG_TYPE_ATTRIB) {
          attribs.push(this.convertAttrib(entity_tio, commonAttrs2));
        }
      }
    });
    return {
      type: "INSERT",
      ...commonAttrs,
      name,
      insertionPoint,
      xScale: scale ? scale.x : 1,
      yScale: scale ? scale.y : 1,
      zScale: scale ? scale.z : 1,
      rotation,
      columnCount,
      rowCount,
      columnSpacing,
      rowSpacing,
      extrusionDirection,
      attribs
    };
  }
  convertLeader(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const styleName = libredwg.dwg_entity_mtext_get_style_name(entity);
    const isArrowheadEnabled = libredwg.dwg_dynapi_entity_data(entity, "arrowhead_type");
    const isSpline = libredwg.dwg_dynapi_entity_data(entity, "path_type");
    const leaderCreationFlag = libredwg.dwg_dynapi_entity_data(entity, "annot_type");
    const isHooklineSameDirection = libredwg.dwg_dynapi_entity_data(entity, "hookline_dir");
    const isHooklineExists = libredwg.dwg_dynapi_entity_data(entity, "hookline_on");
    const textHeight = libredwg.dwg_dynapi_entity_data(entity, "box_height");
    const textWidth = libredwg.dwg_dynapi_entity_data(entity, "box_width");
    const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, "num_points");
    const vertices_ptr = libredwg.dwg_dynapi_entity_data(entity, "points");
    const vertices = numberOfVertices > 0 ? libredwg.dwg_ptr_to_point3d_array(vertices_ptr, numberOfVertices) : [];
    const byBlockColor = libredwg.dwg_dynapi_entity_data(entity, "byblock_color");
    const normal = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const horizontalDirection = libredwg.dwg_dynapi_entity_data(entity, "x_direction");
    const offsetFromBlock = libredwg.dwg_dynapi_entity_data(entity, "inspt_offset");
    const offsetFromAnnotation = libredwg.dwg_dynapi_entity_data(entity, "endptproj");
    return {
      type: "LEADER",
      ...commonAttrs,
      styleName,
      isArrowheadEnabled: isArrowheadEnabled > 0,
      isSpline: isSpline > 0,
      leaderCreationFlag,
      isHooklineSameDirection: isHooklineSameDirection > 0,
      isHooklineExists: isHooklineExists > 0,
      textHeight,
      textWidth,
      numberOfVertices,
      vertices,
      byBlockColor,
      normal,
      horizontalDirection,
      offsetFromBlock,
      offsetFromAnnotation
    };
  }
  convertLine(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const startPoint = libredwg.dwg_dynapi_entity_data(entity, "start");
    const endPoint = libredwg.dwg_dynapi_entity_data(entity, "end");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    return {
      type: "LINE",
      ...commonAttrs,
      thickness,
      startPoint,
      endPoint,
      extrusionDirection
    };
  }
  convertLWPolyline(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, "num_points");
    const flag = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const constantWidth = libredwg.dwg_dynapi_entity_data(entity, "const_width");
    const elevation = libredwg.dwg_dynapi_entity_data(entity, "elevation");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const vertices = [];
    const num_points = libredwg.dwg_dynapi_entity_data(entity, "num_points");
    const points_ptr = libredwg.dwg_dynapi_entity_data(entity, "points");
    const points = libredwg.dwg_ptr_to_point2d_array(points_ptr, num_points);
    const num_bulges = libredwg.dwg_dynapi_entity_data(entity, "num_bulges");
    const bulges_ptr = libredwg.dwg_dynapi_entity_data(entity, "bulges");
    const bulges = libredwg.dwg_ptr_to_double_array(bulges_ptr, num_bulges);
    points.forEach((point, index) => {
      vertices.push({
        id: index,
        x: point.x,
        y: point.y,
        bulge: bulges.length > index ? bulges[index] : 0
      });
    });
    return {
      type: "LWPOLYLINE",
      ...commonAttrs,
      numberOfVertices,
      flag,
      constantWidth,
      elevation,
      thickness,
      extrusionDirection,
      vertices
    };
  }
  convertMLine(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const scale = libredwg.dwg_dynapi_entity_data(entity, "scale");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "flags");
    const justification = libredwg.dwg_dynapi_entity_data(entity, "justification");
    const startPoint = libredwg.dwg_dynapi_entity_data(entity, "base_point");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const numberOfLines = libredwg.dwg_dynapi_entity_data(entity, "num_lines");
    const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, "num_verts");
    const verts_ptr = libredwg.dwg_dynapi_entity_data(entity, "verts");
    const verts = libredwg.dwg_ptr_to_mline_vertex_array(
      verts_ptr,
      numberOfVertices
    );
    const vertices = [];
    verts.forEach((vert) => {
      vertices.push({
        vertex: vert.vertex,
        vertexDirection: vert.vertex_direction,
        miterDirection: vert.miter_direction,
        numberOfLines: vert.num_lines,
        lines: vert.lines.map((line) => {
          return {
            numberOfSegmentParams: line.num_segparms,
            segmentParams: line.segparms,
            numberOfAreaFillParams: line.num_areafillparms,
            areaFillParams: line.areafillparms
          };
        })
      });
    });
    return {
      type: "MLINE",
      ...commonAttrs,
      scale,
      flags,
      justification,
      startPoint,
      extrusionDirection,
      numberOfLines,
      numberOfVertices,
      vertices,
      mlineStyle: ""
      // TODO: Set the correct value
    };
  }
  convertMultiLeader(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const entityVal = (field) => libredwg.dwg_dynapi_entity_data(entity, field);
    const subclassVal = (ptr, subclass, field) => libredwg.dwg_dynapi_subclass_data(ptr, subclass, field);
    const refToId = (ref) => libredwg.dwg_ref_get_id(ref);
    const asBool = (value) => value > 0;
    const mleaderColor = (color) => color != null ? dwgColorToMLeaderRawColor(color) : void 0;
    const version = entityVal("class_version");
    const leaderStyleId = refToId(entityVal("mleaderstyle"));
    const propertyOverrideFlag = entityVal("flags");
    const leaderLineType = entityVal("type");
    const leaderLineColor = mleaderColor(entityVal("line_color"));
    const leaderLineTypeId = refToId(entityVal("line_ltype"));
    const leaderLineWeight = entityVal("line_linewt");
    const landingEnabled = asBool(entityVal("has_landing"));
    const doglegEnabled = asBool(entityVal("has_dogleg"));
    const doglegLength = entityVal("landing_dist");
    const arrowheadId = refToId(entityVal("arrow_handle"));
    const arrowheadSize = entityVal("arrow_size");
    const contentType = entityVal("style_content");
    const textStyleId = refToId(entityVal("text_style"));
    const textLeftAttachmentType = entityVal("text_left");
    const textRightAttachmentType = entityVal("text_right");
    const textAngleType = entityVal("text_angletype");
    const textAlignmentType = entityVal("text_alignment");
    const textColor = mleaderColor(entityVal("text_color"));
    const textFrameEnabled = asBool(entityVal("has_text_frame"));
    const blockContentId = refToId(entityVal("block_style"));
    const blockContentColor = mleaderColor(entityVal("block_color"));
    const blockContentScale = entityVal("block_scale");
    const blockContentRotation = entityVal("block_rotation");
    const blockContentConnectionType = entityVal("style_attachment");
    const annotativeScaleEnabled = asBool(entityVal("is_annotative"));
    const textDirectionNegative = asBool(entityVal("is_neg_textdir"));
    const textAlignInIPE = entityVal("ipe_alignment");
    let textAttachmentPoint = entityVal("justification");
    const textAttachmentDirection = entityVal("attach_dir");
    const bottomTextAttachmentDirection = entityVal("attach_bottom");
    const topTextAttachmentDirection = entityVal("attach_top");
    const contentScale = entityVal("scale_factor");
    const numArrowheads = entityVal("num_arrowheads");
    const arrowheadsPtr = entityVal("arrowheads");
    const arrowHeadSize = libredwg.dwg_dynapi_subclass_size("LEADER_ArrowHead");
    const arrowheadOverrides = [];
    for (let i = 0; i < numArrowheads; i++) {
      const arrowheadPtr = arrowheadsPtr + i * arrowHeadSize;
      arrowheadOverrides.push({
        index: subclassVal(arrowheadPtr, "LEADER_ArrowHead", "is_default"),
        handle: refToId(
          subclassVal(arrowheadPtr, "LEADER_ArrowHead", "arrowhead")
        ) ?? ""
      });
    }
    const numBlocklabels = entityVal("num_blocklabels");
    const blocklabelsPtr = entityVal("blocklabels");
    const blockLabelSize = libredwg.dwg_dynapi_subclass_size("LEADER_BlockLabel");
    const blockAttributes = [];
    for (let i = 0; i < numBlocklabels; i++) {
      const blocklabelPtr = blocklabelsPtr + i * blockLabelSize;
      blockAttributes.push({
        id: refToId(
          subclassVal(blocklabelPtr, "LEADER_BlockLabel", "attdef")
        ),
        index: subclassVal(
          blocklabelPtr,
          "LEADER_BlockLabel",
          "ui_index"
        ),
        width: subclassVal(blocklabelPtr, "LEADER_BlockLabel", "width"),
        text: subclassVal(
          blocklabelPtr,
          "LEADER_BlockLabel",
          "label_text"
        )
      });
    }
    const ctxPtr = entity + libredwg.dwg_dynapi_entity_field_offset(entity, "ctx");
    const contentPtr = ctxPtr + libredwg.dwg_dynapi_subclass_field_offset(
      "MLEADER_AnnotContext",
      "content"
    );
    const contentScaleFactor = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "scale_factor"
    );
    const contentBasePosition = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "content_base"
    );
    const landingGap = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "landing_gap"
    );
    const textAttachment = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "attach_dir"
    );
    const contextTextHeight = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "text_height"
    );
    const contextArrowSize = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "arrow_size"
    );
    const contextTextLeft = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "text_left"
    );
    const contextTextRight = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "text_right"
    );
    const contextTextAngleType = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "text_angletype"
    );
    const contextTextAlignment = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "text_alignment"
    );
    const hasMText = asBool(
      subclassVal(ctxPtr, "MLEADER_AnnotContext", "has_content_txt")
    );
    const hasBlock = asBool(
      subclassVal(ctxPtr, "MLEADER_AnnotContext", "has_content_blk")
    );
    const planeOrigin = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "base"
    );
    const planeXAxisDirection = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "base_dir"
    );
    const planeYAxisDirection = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "base_vert"
    );
    const planeNormalReversed = asBool(
      subclassVal(ctxPtr, "MLEADER_AnnotContext", "is_normal_reversed")
    );
    let textFlowDirection;
    let normal;
    let textRotation;
    let textWidth;
    let textLineSpacingFactor;
    let textLineSpacingStyle;
    let textAnchor;
    let textDirection;
    let textBackgroundColor;
    let textBackgroundScaleFactor;
    let textBackgroundTransparency;
    let textBackgroundColorOn;
    let textFillOn;
    let textColumnType;
    let textUseAutoHeight;
    let textColumnWidth;
    let textColumnGutterWidth;
    let textColumnFlowReversed;
    let textColumnHeight;
    let textUseWordBreak;
    let textContent;
    if (hasMText) {
      const textAlignment = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "alignment"
      );
      if (textAlignment != null && textAlignment !== 0) {
        textAttachmentPoint = textAlignment;
      }
      normal = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "normal"
      );
      textAnchor = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "location"
      );
      textRotation = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "rotation"
      );
      textDirection = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "direction"
      );
      textWidth = subclassVal(contentPtr, "MLEADER_Content_MText", "width");
      textLineSpacingFactor = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "line_spacing_factor"
      );
      textLineSpacingStyle = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "line_spacing_style"
      );
      textFlowDirection = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "flow"
      );
      textBackgroundColor = mleaderColor(
        subclassVal(
          contentPtr,
          "MLEADER_Content_MText",
          "bg_color"
        )
      );
      textBackgroundScaleFactor = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "bg_scale"
      );
      textBackgroundTransparency = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "bg_transparency"
      );
      textFillOn = asBool(
        subclassVal(contentPtr, "MLEADER_Content_MText", "is_bg_fill")
      );
      textBackgroundColorOn = asBool(
        subclassVal(
          contentPtr,
          "MLEADER_Content_MText",
          "is_bg_mask_fill"
        )
      );
      textColumnType = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "col_type"
      );
      textUseAutoHeight = asBool(
        subclassVal(
          contentPtr,
          "MLEADER_Content_MText",
          "is_height_auto"
        )
      );
      textColumnWidth = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "col_width"
      );
      textColumnGutterWidth = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "col_gutter"
      );
      textColumnFlowReversed = asBool(
        subclassVal(
          contentPtr,
          "MLEADER_Content_MText",
          "is_col_flow_reversed"
        )
      );
      const numColSizes = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "num_col_sizes"
      );
      const colSizesPtr = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "col_sizes"
      );
      if (numColSizes > 0) {
        textColumnHeight = libredwg.dwg_ptr_to_double_array(
          colSizesPtr,
          numColSizes
        )[0];
      }
      textUseWordBreak = asBool(
        subclassVal(contentPtr, "MLEADER_Content_MText", "word_break")
      );
      textContent = subclassVal(
        contentPtr,
        "MLEADER_Content_MText",
        "default_text"
      );
    }
    let blockContent;
    if (hasBlock) {
      const transformPtr = subclassVal(
        contentPtr,
        "MLEADER_Content_Block",
        "transform"
      );
      blockContent = {
        blockContentId: refToId(
          subclassVal(contentPtr, "MLEADER_Content_Block", "block_table")
        ),
        normal: subclassVal(
          contentPtr,
          "MLEADER_Content_Block",
          "normal"
        ),
        position: subclassVal(
          contentPtr,
          "MLEADER_Content_Block",
          "location"
        ),
        scale: subclassVal(
          contentPtr,
          "MLEADER_Content_Block",
          "scale"
        ),
        rotation: subclassVal(
          contentPtr,
          "MLEADER_Content_Block",
          "rotation"
        ),
        color: mleaderColor(
          subclassVal(
            contentPtr,
            "MLEADER_Content_Block",
            "color"
          )
        ),
        transformationMatrix: transformPtr ? libredwg.dwg_ptr_to_double_array(transformPtr, 16) : void 0
      };
    }
    const numLeaders = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "num_leaders"
    );
    const leadersPtr = subclassVal(
      ctxPtr,
      "MLEADER_AnnotContext",
      "leaders"
    );
    const leaderNodeSize = libredwg.dwg_dynapi_subclass_size("LEADER_Node");
    const leaderLineSize = libredwg.dwg_dynapi_subclass_size("LEADER_Line");
    const leaderBreakSize = libredwg.dwg_dynapi_subclass_size("LEADER_Break");
    const leaderSections = [];
    for (let i = 0; i < numLeaders; i++) {
      const nodePtr = leadersPtr + i * leaderNodeSize;
      const lastLeaderLinePointSet = asBool(
        subclassVal(nodePtr, "LEADER_Node", "has_lastleaderlinepoint")
      );
      const doglegVectorSet = asBool(
        subclassVal(nodePtr, "LEADER_Node", "has_dogleg")
      );
      const numBreaks = subclassVal(nodePtr, "LEADER_Node", "num_breaks");
      const breaksPtr = subclassVal(nodePtr, "LEADER_Node", "breaks");
      const nodeBreaks = [];
      for (let j = 0; j < numBreaks; j++) {
        const breakPtr = breaksPtr + j * leaderBreakSize;
        nodeBreaks.push({
          start: subclassVal(breakPtr, "LEADER_Break", "start"),
          end: subclassVal(breakPtr, "LEADER_Break", "end")
        });
      }
      const numLines = subclassVal(nodePtr, "LEADER_Node", "num_lines");
      const linesPtr = subclassVal(nodePtr, "LEADER_Node", "lines");
      const leaderLines = [];
      for (let j = 0; j < numLines; j++) {
        const linePtr = linesPtr + j * leaderLineSize;
        const numPoints = subclassVal(
          linePtr,
          "LEADER_Line",
          "num_points"
        );
        const pointsPtr = subclassVal(linePtr, "LEADER_Line", "points");
        const vertices = numPoints > 0 ? libredwg.dwg_ptr_to_point3d_array(pointsPtr, numPoints) : [];
        const lineNumBreaks = subclassVal(
          linePtr,
          "LEADER_Line",
          "num_breaks"
        );
        const lineBreaksPtr = subclassVal(
          linePtr,
          "LEADER_Line",
          "breaks"
        );
        const lineBreaks = [];
        for (let k = 0; k < lineNumBreaks; k++) {
          const breakPtr = lineBreaksPtr + k * leaderBreakSize;
          lineBreaks.push({
            start: subclassVal(breakPtr, "LEADER_Break", "start"),
            end: subclassVal(breakPtr, "LEADER_Break", "end")
          });
        }
        leaderLines.push({
          vertices,
          leaderLineIndex: subclassVal(
            linePtr,
            "LEADER_Line",
            "line_index"
          ),
          breaks: lineBreaks.length > 0 ? lineBreaks : void 0
        });
      }
      leaderSections.push({
        lastLeaderLinePoint: lastLeaderLinePointSet ? subclassVal(
          nodePtr,
          "LEADER_Node",
          "lastleaderlinepoint"
        ) : void 0,
        lastLeaderLinePointSet,
        doglegVector: doglegVectorSet ? subclassVal(nodePtr, "LEADER_Node", "dogleg_vector") : void 0,
        doglegVectorSet,
        doglegLength: subclassVal(nodePtr, "LEADER_Node", "dogleg_length"),
        breaks: nodeBreaks.length > 0 ? nodeBreaks : void 0,
        leaderBranchIndex: subclassVal(
          nodePtr,
          "LEADER_Node",
          "branch_index"
        ),
        leaderLines
      });
    }
    return {
      type: "MULTILEADER",
      ...commonAttrs,
      subclassMarker: "AcDbMLeader",
      version,
      leaderStyleId,
      propertyOverrideFlag,
      leaderLineType,
      leaderLineColor,
      leaderLineTypeId,
      leaderLineWeight,
      landingEnabled,
      doglegEnabled,
      doglegLength,
      arrowheadId,
      arrowheadSize: arrowheadSize || contextArrowSize,
      contentType,
      textStyleId,
      textLeftAttachmentType: textLeftAttachmentType || contextTextLeft,
      textRightAttachmentType: textRightAttachmentType || contextTextRight,
      textAngleType: textAngleType || contextTextAngleType,
      textAlignmentType: textAlignmentType || contextTextAlignment,
      textColor,
      textFrameEnabled,
      landingGap,
      textAttachment,
      textFlowDirection,
      blockContentId,
      blockContentColor,
      blockContentScale,
      blockContentRotation,
      blockContentConnectionType,
      annotativeScaleEnabled,
      arrowheadOverrides: arrowheadOverrides.length > 0 ? arrowheadOverrides : void 0,
      blockAttributes: blockAttributes.length > 0 ? blockAttributes : void 0,
      textDirectionNegative,
      textAlignInIPE,
      textAttachmentPoint,
      textAttachmentDirection,
      bottomTextAttachmentDirection,
      topTextAttachmentDirection,
      contentScale: contentScale || contentScaleFactor,
      contentBasePosition,
      normal,
      textHeight: contextTextHeight,
      textRotation,
      textWidth,
      textLineSpacingFactor,
      textLineSpacingStyle,
      textAnchor,
      textDirection,
      textBackgroundColor,
      textBackgroundScaleFactor,
      textBackgroundTransparency,
      textBackgroundColorOn,
      textFillOn,
      textColumnType,
      textUseAutoHeight,
      textColumnWidth,
      textColumnGutterWidth,
      textColumnFlowReversed,
      textColumnHeight,
      textUseWordBreak,
      textContent,
      hasMText,
      hasBlock,
      blockContent,
      planeOrigin,
      planeXAxisDirection,
      planeYAxisDirection,
      planeNormalReversed,
      leaderSections: leaderSections.length > 0 ? leaderSections : void 0
    };
  }
  convertOle2Frame(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const oleVersion = libredwg.dwg_dynapi_entity_data(entity, "oleversion");
    const oleClient = libredwg.dwg_dynapi_entity_data(entity, "oleclient");
    const dataSize = libredwg.dwg_dynapi_entity_data(entity, "data_size");
    let leftUpPoint = libredwg.dwg_dynapi_entity_data(entity, "pt1");
    let rightDownPoint = libredwg.dwg_dynapi_entity_data(entity, "pt2");
    const lockAspect = libredwg.dwg_dynapi_entity_data(entity, "lock_aspect");
    const oleObjectType = libredwg.dwg_dynapi_entity_data(entity, "type");
    const tileModeDescriptor = libredwg.dwg_dynapi_entity_data(entity, "mode");
    const dataBytes = libredwg.dwg_entity_ole2frame_get_data(entity);
    const binaryData = dataBytes ? uint8ArrayToHexString(dataBytes) : "";
    if (dataBytes) {
      const corners = decodeOle2FrameCornersFromData(dataBytes);
      if (corners) {
        leftUpPoint = corners.upperLeft;
        rightDownPoint = corners.lowerRight;
      }
    }
    return {
      type: "OLE2FRAME",
      ...commonAttrs,
      oleVersion,
      oleClient,
      dataSize,
      leftUpPoint,
      rightDownPoint,
      lockAspect,
      oleObjectType,
      tileModeDescriptor,
      binaryData
    };
  }
  convertOleFrame(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const flag = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const mode = libredwg.dwg_dynapi_entity_data(entity, "mode");
    const dataSize = libredwg.dwg_dynapi_entity_data(entity, "data_size");
    const dataBytes = libredwg.dwg_entity_oleframe_get_data(entity);
    const binaryData = dataBytes ? uint8ArrayToHexString(dataBytes) : "";
    return {
      type: "OLEFRAME",
      ...commonAttrs,
      flag,
      mode,
      dataSize,
      binaryData
    };
  }
  convertMText(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const textHeight = libredwg.dwg_dynapi_entity_data(entity, "text_height");
    const rectHeight = libredwg.dwg_dynapi_entity_data(entity, "rect_height");
    const rectWidth = libredwg.dwg_dynapi_entity_data(entity, "rect_width");
    const extentsWidth = libredwg.dwg_dynapi_entity_data(entity, "extents_width");
    const extentsHeight = libredwg.dwg_dynapi_entity_data(entity, "extents_height");
    const attachmentPoint = libredwg.dwg_dynapi_entity_data(entity, "attachment");
    const drawingDirection = libredwg.dwg_dynapi_entity_data(entity, "flow_dir");
    const text = libredwg.dwg_dynapi_entity_data(entity, "text");
    const styleName = libredwg.dwg_entity_mtext_get_style_name(entity);
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const direction = libredwg.dwg_dynapi_entity_data(entity, "x_axis_dir");
    const lineSpacingStyle = libredwg.dwg_dynapi_entity_data(entity, "linespace_style");
    const lineSpacing = libredwg.dwg_dynapi_entity_data(entity, "linespace_factor");
    const backgroundFill = libredwg.dwg_dynapi_entity_data(entity, "bg_fill_flag");
    const fillBoxScale = libredwg.dwg_dynapi_entity_data(entity, "bg_fill_scale");
    const backgroundFillColor = libredwg.dwg_dynapi_entity_data(entity, "bg_fill_color");
    const backgroundFillTransparency = libredwg.dwg_dynapi_entity_data(entity, "bg_fill_trans");
    const columnType = libredwg.dwg_dynapi_entity_data(entity, "column_type");
    const columnFlowReversed = libredwg.dwg_dynapi_entity_data(entity, "flow_reversed");
    const columnAutoHeight = libredwg.dwg_dynapi_entity_data(entity, "auto_height");
    const columnWidth = libredwg.dwg_dynapi_entity_data(entity, "column_width");
    const columnGutter = libredwg.dwg_dynapi_entity_data(entity, "gutter");
    const columnHeightCount = libredwg.dwg_dynapi_entity_data(entity, "num_column_heights");
    const columnHeights_ptr = libredwg.dwg_dynapi_entity_data(entity, "column_heights");
    const columnHeights = libredwg.dwg_ptr_to_double_array(
      columnHeights_ptr,
      columnHeightCount
    );
    return {
      type: "MTEXT",
      ...commonAttrs,
      insertionPoint,
      textHeight,
      rectHeight,
      rectWidth,
      extentsHeight,
      extentsWidth,
      attachmentPoint,
      drawingDirection,
      text,
      styleName,
      extrusionDirection,
      direction,
      rotation: 0,
      // TODO: Didn't find the corresponding field in libredwg
      lineSpacingStyle,
      lineSpacing,
      backgroundFill,
      // backgroundColor: backgroundColor.rgb, // TODO: Double check whether it should be color index
      fillBoxScale,
      backgroundFillColor: backgroundFillColor.rgb,
      // TODO: Double check whether it should be color index
      backgroundFillTransparency,
      columnType,
      // columnCount: columnCount,
      columnFlowReversed,
      columnAutoHeight,
      columnWidth,
      columnGutter,
      columnHeightCount,
      columnHeights
    };
  }
  convertPoint(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const x = libredwg.dwg_dynapi_entity_data(entity, "x");
    const y = libredwg.dwg_dynapi_entity_data(entity, "y");
    const z = libredwg.dwg_dynapi_entity_data(entity, "z");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const angle = libredwg.dwg_dynapi_entity_data(entity, "x_ang");
    return {
      type: "POINT",
      ...commonAttrs,
      position: { x, y, z },
      thickness,
      extrusionDirection,
      angle
    };
  }
  convertPolyline2d(entity, commonAttrs, object) {
    const libredwg = this.libredwg;
    const flag = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const smoothType = libredwg.dwg_dynapi_entity_data(entity, "curve_type");
    const startWidth = libredwg.dwg_dynapi_entity_data(entity, "start_width");
    const endWidth = libredwg.dwg_dynapi_entity_data(entity, "end_width");
    const elevation = libredwg.dwg_dynapi_entity_data(entity, "elevation");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const vertices = libredwg.dwg_entity_polyline_2d_get_vertices(object) ?? [];
    return {
      type: "POLYLINE2D",
      ...commonAttrs,
      flag,
      smoothType,
      startWidth,
      endWidth,
      elevation,
      thickness,
      extrusionDirection,
      vertices: vertices.map((vertex) => {
        return {
          x: vertex.point.x,
          y: vertex.point.y,
          z: vertex.point.z,
          startWidth: vertex.start_width,
          endWidth: vertex.end_width,
          bulge: vertex.bulge,
          flag: vertex.flag,
          tangentDirection: vertex.tangent_dir
        };
      }),
      meshMVertexCount: 0,
      meshNVertexCount: 0,
      surfaceMDensity: 0,
      surfaceNDensity: 0
    };
  }
  convertPolyline3d(entity, commonAttrs, object) {
    const libredwg = this.libredwg;
    const flag = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const smoothType = libredwg.dwg_dynapi_entity_data(entity, "curve_type");
    const startWidth = libredwg.dwg_dynapi_entity_data(entity, "start_width");
    const endWidth = libredwg.dwg_dynapi_entity_data(entity, "end_width");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const vertices = libredwg.dwg_entity_polyline_3d_get_vertices(object) ?? [];
    return {
      type: "POLYLINE3D",
      ...commonAttrs,
      flag,
      smoothType,
      startWidth,
      endWidth,
      extrusionDirection,
      vertices: vertices.map((vertex) => {
        return {
          x: vertex.point.x,
          y: vertex.point.y,
          z: vertex.point.z,
          flag: vertex.flag
        };
      })
    };
  }
  convertProxyEntity(entity, commonAttrs, objectPtr) {
    const libredwg = this.libredwg;
    const proxyEntityClassId = libredwg.dwg_dynapi_entity_data(entity, "proxy_id");
    const applicationEntityClassId = libredwg.dwg_dynapi_entity_data(entity, "class_id");
    const entityDataSize = libredwg.dwg_dynapi_entity_data(entity, "data_numbits");
    const objectDrawingFormat = libredwg.dwg_dynapi_entity_data(entity, "version");
    const fromDxf = libredwg.dwg_dynapi_entity_data(entity, "from_dxf");
    const numObjIds = libredwg.dwg_dynapi_entity_data(entity, "num_objids");
    const graphicsBytes = libredwg.dwg_entity_get_preview(objectPtr);
    const graphicsDataSize = (graphicsBytes == null ? void 0 : graphicsBytes.length) ?? 0;
    const entityBytes = libredwg.dwg_entity_proxy_entity_get_entity_data(entity);
    const graphicsData = graphicsBytes ? uint8ArrayToHexString(graphicsBytes) : void 0;
    const entityData = entityBytes ? uint8ArrayToHexString(entityBytes) : void 0;
    let linkedObjectIds;
    if (numObjIds > 0) {
      const objidsPtr = libredwg.dwg_dynapi_entity_data(entity, "objids");
      if (objidsPtr) {
        const objids = libredwg.dwg_ptr_to_object_ref_array(
          objidsPtr,
          numObjIds
        );
        linkedObjectIds = objids.map((ref) => idToString(ref.absolute_ref));
      }
    }
    const originalDxfName = this.getOriginalDxfName(applicationEntityClassId);
    const result = {
      type: "ACAD_PROXY_ENTITY",
      subclassMarker: "AcDbProxyEntity",
      ...commonAttrs,
      proxyEntityClassId: proxyEntityClassId || 498,
      applicationEntityClassId
    };
    if (originalDxfName) {
      result.originalDxfName = originalDxfName;
    }
    if (graphicsDataSize > 0) {
      result.graphicsDataSize = graphicsDataSize;
    }
    if (graphicsData) {
      result.graphicsData = graphicsData;
    }
    if (entityDataSize > 0) {
      result.entityDataSize = entityDataSize;
    }
    if (entityData) {
      result.entityData = entityData;
    }
    if (linkedObjectIds && linkedObjectIds.length > 0) {
      result.linkedObjectIds = linkedObjectIds;
    }
    if (objectDrawingFormat) {
      result.objectDrawingFormat = objectDrawingFormat;
    }
    if (fromDxf === 0 || fromDxf === 1) {
      result.originalDataFormat = fromDxf;
    }
    return result;
  }
  getOriginalDxfName(classId) {
    if (this.classes.length === 0 || classId < 0) {
      return void 0;
    }
    const index = classId >= 500 ? classId - 500 : classId;
    if (index >= 0 && index < this.classes.length) {
      return this.classes[index].dxfName;
    }
    return void 0;
  }
  convertRay(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const firstPoint = libredwg.dwg_dynapi_entity_data(entity, "point");
    const unitDirection = libredwg.dwg_dynapi_entity_data(entity, "vector");
    return {
      type: "RAY",
      ...commonAttrs,
      firstPoint,
      unitDirection
    };
  }
  convertSection(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const state = libredwg.dwg_dynapi_entity_data(entity, "state");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const name = libredwg.dwg_dynapi_entity_data(entity, "name");
    const verticalDirection = libredwg.dwg_dynapi_entity_data(entity, "vert_dir");
    const topHeight = libredwg.dwg_dynapi_entity_data(entity, "top_height");
    const bottomHeight = libredwg.dwg_dynapi_entity_data(entity, "bottom_height");
    const indicatorTransparency = libredwg.dwg_dynapi_entity_data(entity, "indicator_alpha");
    const indicatorColor = libredwg.dwg_dynapi_entity_data(entity, "indicator_color");
    const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, "num_verts");
    const vertices_ptr = libredwg.dwg_dynapi_entity_data(entity, "verts");
    const vertices = numberOfVertices > 0 ? libredwg.dwg_ptr_to_point3d_array(vertices_ptr, numberOfVertices) : [];
    const numberOfBackLineVertices = libredwg.dwg_dynapi_entity_data(entity, "num_blverts");
    const backLineVertices_ptr = libredwg.dwg_dynapi_entity_data(entity, "blverts");
    const backLineVertices = numberOfBackLineVertices > 0 ? libredwg.dwg_ptr_to_point3d_array(
      backLineVertices_ptr,
      numberOfBackLineVertices
    ) : [];
    const geometrySettingHandle = libredwg.dwg_dynapi_entity_data(entity, "geometrySettingHardId");
    const geometrySettingHardId = libredwg.dwg_ref_get_handle_absolute_ref(geometrySettingHandle) ?? 0n;
    return {
      type: "SECTION",
      ...commonAttrs,
      state,
      flags,
      name,
      verticalDirection,
      topHeight,
      bottomHeight,
      indicatorTransparency,
      indicatorColor: indicatorColor.rgb,
      numberOfVertices,
      vertices,
      numberOfBackLineVertices,
      backLineVertices,
      geometrySettingHardId
    };
  }
  convertShape(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const size = libredwg.dwg_dynapi_entity_data(entity, "scale");
    const rotation = libredwg.dwg_dynapi_entity_data(entity, "rotation");
    const xScale = libredwg.dwg_dynapi_entity_data(entity, "width_factor");
    const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, "oblique_angle");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const shapeNumber = libredwg.dwg_dynapi_entity_data(entity, "style_id");
    const styleName = libredwg.dwg_entity_text_get_style_name(entity);
    return {
      type: "SHAPE",
      subclassMarker: "AcDbShape",
      ...commonAttrs,
      thickness,
      insertionPoint,
      size,
      shapeNumber,
      styleName,
      rotation,
      xScale,
      obliqueAngle,
      extrusionDirection
    };
  }
  convertSolid(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const corner1 = libredwg.dwg_dynapi_entity_data(entity, "corner1");
    const corner2 = libredwg.dwg_dynapi_entity_data(entity, "corner2");
    const corner3 = libredwg.dwg_dynapi_entity_data(entity, "corner3");
    const corner4 = libredwg.dwg_dynapi_entity_data(entity, "corner4");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    return {
      type: "SOLID",
      ...commonAttrs,
      corner1,
      corner2,
      corner3,
      corner4,
      thickness,
      extrusionDirection
    };
  }
  convertSpline(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const flag = libredwg.dwg_dynapi_entity_data(entity, "splineflags");
    const degree = libredwg.dwg_dynapi_entity_data(entity, "degree");
    const knotTolerance = libredwg.dwg_dynapi_entity_data(entity, "knot_tol");
    const numberOfKnots = libredwg.dwg_dynapi_entity_data(entity, "num_knots");
    const knots_ptr = libredwg.dwg_dynapi_entity_data(entity, "knots");
    const knots = libredwg.dwg_ptr_to_double_array(knots_ptr, numberOfKnots);
    const fitTolerance = libredwg.dwg_dynapi_entity_data(entity, "fit_tol");
    const numberOfFitPoints = libredwg.dwg_dynapi_entity_data(entity, "num_fit_pts");
    const fit_pts_ptr = libredwg.dwg_dynapi_entity_data(entity, "fit_pts");
    const fitPoints = libredwg.dwg_ptr_to_point3d_array(
      fit_pts_ptr,
      numberOfFitPoints
    );
    const weighted = libredwg.dwg_dynapi_entity_data(entity, "weighted");
    const controlTolerance = libredwg.dwg_dynapi_entity_data(entity, "ctrl_tol");
    const numberOfControlPoints = libredwg.dwg_dynapi_entity_data(entity, "num_ctrl_pts");
    const ctrl_pts_ptr = libredwg.dwg_dynapi_entity_data(entity, "ctrl_pts");
    const controlPoints = libredwg.dwg_ptr_to_point4d_array(
      ctrl_pts_ptr,
      numberOfControlPoints
    );
    const startTangent = libredwg.dwg_dynapi_entity_data(entity, "beg_tan_vec");
    const endTangent = libredwg.dwg_dynapi_entity_data(entity, "end_tan_vec");
    return {
      type: "SPLINE",
      ...commonAttrs,
      // normal?: DwgPoint3D
      flag,
      degree,
      numberOfKnots,
      numberOfControlPoints,
      numberOfFitPoints,
      knotTolerance,
      controlTolerance,
      fitTolerance,
      startTangent,
      endTangent,
      knots,
      weights: weighted ? controlPoints.map((value) => value.w) : void 0,
      controlPoints: controlPoints.map((value) => {
        return {
          x: value.x,
          y: value.y,
          z: value.z
        };
      }),
      fitPoints
    };
  }
  convertTable(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const name = libredwg.dwg_dynapi_subclass_data(entity, "ldata", "name");
    const startPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const directionVector = libredwg.dwg_dynapi_entity_data(entity, "horiz_direction");
    const tableValue = libredwg.dwg_dynapi_entity_data(entity, "flag_for_table_value");
    const rowCount = libredwg.dwg_dynapi_entity_data(entity, "num_rows");
    const columnCount = libredwg.dwg_dynapi_entity_data(entity, "num_cols");
    const row_heights_ptr = libredwg.dwg_dynapi_entity_data(entity, "row_heights");
    const rowHeightArr = libredwg.dwg_ptr_to_double_array(
      row_heights_ptr,
      rowCount
    );
    const col_widths_ptr = libredwg.dwg_dynapi_entity_data(entity, "col_widths");
    const columnWidthArr = libredwg.dwg_ptr_to_double_array(
      col_widths_ptr,
      columnCount
    );
    const table_style_ref = libredwg.dwg_dynapi_entity_data(entity, "tablestyle");
    const tableStyleId = libredwg.dwg_ref_get_id(table_style_ref) ?? "";
    const block_header_ref = libredwg.dwg_dynapi_entity_data(entity, "block_header");
    const blockRecordHandle = libredwg.dwg_ref_get_id(block_header_ref) ?? "";
    const overrideFlag = libredwg.dwg_dynapi_entity_data(entity, "table_flag_override");
    const borderColorOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, "border_color_overrides_flag");
    const borderLineWeightOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, "border_lineweight_overrides_flag");
    const borderVisibilityOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, "border_visibility_overrides_flag");
    const num_cells = libredwg.dwg_dynapi_entity_data(entity, "num_cells");
    const cells_ptr = libredwg.dwg_dynapi_entity_data(entity, "cells");
    const cells = libredwg.dwg_ptr_to_table_cell_array(cells_ptr, num_cells);
    return {
      type: "ACAD_TABLE",
      ...commonAttrs,
      name,
      startPoint,
      directionVector,
      // attachmentPoint: DwgAttachmentPoint
      tableValue,
      rowCount,
      columnCount,
      overrideFlag,
      borderColorOverrideFlag,
      borderLineWeightOverrideFlag,
      borderVisibilityOverrideFlag,
      rowHeightArr,
      columnWidthArr,
      tableStyleId,
      blockRecordHandle,
      cells: this.convertTableCells(cells),
      bmpPreview: ""
    };
  }
  convertTableCells(cells) {
    return cells.map((cell) => {
      var _a, _b;
      return {
        text: cell.text_value,
        attachmentPoint: cell.cell_alignment,
        textStyle: cell.text_style ? String(cell.text_style) : void 0,
        rotation: cell.rotation,
        cellType: cell.type,
        flagValue: cell.flags,
        mergedValue: cell.is_merged_value,
        autoFit: cell.is_autofit_flag,
        topBorderVisibility: !!cell.top_visibility,
        bottomBorderVisibility: !!cell.bottom_visibility,
        leftBorderVisibility: !!cell.left_visibility,
        rightBorderVisibility: !!cell.right_visibility,
        overrideFlag: cell.cell_flag_override,
        virtualEdgeFlag: cell.virtual_edge_flag,
        blockTableRecordId: cell.block_handle ? String(cell.block_handle.absolute_ref ?? "") : void 0,
        blockScale: cell.block_scale,
        blockAttrNum: ((_a = cell.attr_defs) == null ? void 0 : _a.length) ?? 0,
        attrDefineId: (_b = cell.attr_defs) == null ? void 0 : _b.map(
          (value) => {
            var _a2;
            return String(((_a2 = value.attdef) == null ? void 0 : _a2.absolute_ref) ?? "");
          }
        ),
        textHeight: cell.text_height ?? 0,
        extendedCellFlags: cell.additional_data_flag
      };
    });
  }
  convertTextBase(entity) {
    const libredwg = this.libredwg;
    const text = libredwg.dwg_dynapi_entity_data(entity, "text_value");
    const thickness = libredwg.dwg_dynapi_entity_data(entity, "thickness");
    const startPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const endPoint = libredwg.dwg_dynapi_entity_data(entity, "alignment_pt");
    const rotation = libredwg.dwg_dynapi_entity_data(entity, "rotation");
    const textHeight = libredwg.dwg_dynapi_entity_data(entity, "height");
    const xScale = libredwg.dwg_dynapi_entity_data(entity, "width_factor");
    const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, "oblique_angle");
    const styleName = libredwg.dwg_entity_text_get_style_name(entity);
    const generationFlag = libredwg.dwg_dynapi_entity_data(entity, "generation");
    const halign = libredwg.dwg_dynapi_entity_data(entity, "horiz_alignment");
    const valign = libredwg.dwg_dynapi_entity_data(entity, "vert_alignment");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    return {
      text,
      thickness,
      startPoint,
      endPoint,
      textHeight,
      rotation,
      xScale,
      obliqueAngle,
      styleName,
      generationFlag,
      halign,
      valign,
      extrusionDirection
    };
  }
  convertText(entity, commonAttrs) {
    return {
      type: "TEXT",
      ...commonAttrs,
      ...this.convertTextBase(entity)
    };
  }
  convertTolerance(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, "ins_pt");
    const text = libredwg.dwg_dynapi_entity_data(entity, "text_value");
    const xAxisDirection = libredwg.dwg_dynapi_entity_data(entity, "x_direction");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const dimStyleName = libredwg.dwg_entity_get_dimstyle_name(entity);
    return {
      type: "TOLERANCE",
      ...commonAttrs,
      styleName: dimStyleName,
      insertionPoint,
      text,
      extrusionDirection,
      xAxisDirection
    };
  }
  convertViewport(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const viewportCenter = libredwg.dwg_dynapi_entity_data(entity, "center");
    const width = libredwg.dwg_dynapi_entity_data(entity, "width");
    const height = libredwg.dwg_dynapi_entity_data(entity, "height");
    const status = libredwg.dwg_dynapi_entity_data(entity, "on_off");
    const displayCenter = libredwg.dwg_dynapi_entity_data(entity, "VIEWCTR");
    const snapBase = libredwg.dwg_dynapi_entity_data(entity, "SNAPBASE");
    const snapSpacing = libredwg.dwg_dynapi_entity_data(entity, "SNAPUNIT");
    const gridSpacing = libredwg.dwg_dynapi_entity_data(entity, "GRIDUNIT");
    const viewDirection = libredwg.dwg_dynapi_entity_data(entity, "VIEWDIR");
    const targetPoint = libredwg.dwg_dynapi_entity_data(entity, "view_target");
    const perspectiveLensLength = libredwg.dwg_dynapi_entity_data(entity, "lens_length");
    const frontClipZ = libredwg.dwg_dynapi_entity_data(entity, "front_clip_z");
    const backClipZ = libredwg.dwg_dynapi_entity_data(entity, "back_clip_z");
    const viewHeight = libredwg.dwg_dynapi_entity_data(entity, "VIEWSIZE");
    const snapAngle = libredwg.dwg_dynapi_entity_data(entity, "SNAPANG");
    const viewTwistAngle = libredwg.dwg_dynapi_entity_data(entity, "twist_angle");
    const circleZoomPercent = libredwg.dwg_dynapi_entity_data(entity, "circle_zoom");
    const statusBitFlags = libredwg.dwg_dynapi_entity_data(entity, "status_flag");
    const sheetName = libredwg.dwg_dynapi_entity_data(entity, "style_sheet");
    const renderMode = libredwg.dwg_dynapi_entity_data(entity, "render_mode");
    const ucsPerViewport = libredwg.dwg_dynapi_entity_data(entity, "UCSVP");
    const ucsOrigin = libredwg.dwg_dynapi_entity_data(entity, "ucsorg");
    const ucsXAxis = libredwg.dwg_dynapi_entity_data(entity, "ucsxdir");
    const ucsYAxis = libredwg.dwg_dynapi_entity_data(entity, "ucsydir");
    const named_ucs_ref = libredwg.dwg_dynapi_entity_data(entity, "named_ucs");
    const ucsId = libredwg.dwg_ref_get_id(named_ucs_ref);
    const base_ucs_ref = libredwg.dwg_dynapi_entity_data(entity, "base_ucs");
    const ucsBaseId = libredwg.dwg_ref_get_id(base_ucs_ref);
    const orthographicType = libredwg.dwg_dynapi_entity_data(entity, "UCSORTHOVIEW");
    const elevation = libredwg.dwg_dynapi_entity_data(entity, "ucs_elevation");
    const shadePlotMode = libredwg.dwg_dynapi_entity_data(entity, "shadeplot_mode");
    const isDefaultLighting = libredwg.dwg_dynapi_entity_data(entity, "use_default_lights");
    const defaultLightingType = libredwg.dwg_dynapi_entity_data(entity, "default_lighting_type");
    const brightness = libredwg.dwg_dynapi_entity_data(entity, "brightness");
    const contrast = libredwg.dwg_dynapi_entity_data(entity, "contrast");
    const majorGridFrequency = libredwg.dwg_dynapi_entity_data(entity, "grid_major");
    const background_ref = libredwg.dwg_dynapi_entity_data(entity, "background");
    const backgroundId = libredwg.dwg_ref_get_id(background_ref);
    const shadeplot_ref = libredwg.dwg_dynapi_entity_data(entity, "shadeplot");
    const shadePlotId = libredwg.dwg_ref_get_id(shadeplot_ref);
    const visualstyle_ref = libredwg.dwg_dynapi_entity_data(entity, "visualstyle");
    const visualStyleId = libredwg.dwg_ref_get_id(visualstyle_ref);
    const sun_ref = libredwg.dwg_dynapi_entity_data(entity, "sun");
    const sunId = libredwg.dwg_ref_get_id(sun_ref);
    return {
      type: "VIEWPORT",
      ...commonAttrs,
      viewportCenter,
      width,
      height,
      status,
      viewportId: 0,
      // Will be set later in LibreDwgConverter.convert
      displayCenter,
      snapBase,
      snapSpacing,
      gridSpacing,
      viewDirection,
      targetPoint,
      perspectiveLensLength,
      frontClipZ,
      backClipZ,
      viewHeight,
      snapAngle,
      viewTwistAngle,
      circleZoomPercent,
      statusBitFlags,
      sheetName,
      renderMode,
      ucsPerViewport,
      ucsOrigin,
      ucsXAxis,
      ucsYAxis,
      ucsId: ucsId ?? "",
      ucsBaseId: ucsBaseId ?? "",
      orthographicType,
      elevation,
      shadePlotMode,
      majorGridFrequency,
      backgroundId: backgroundId ?? "",
      shadePlotId: shadePlotId ?? "",
      visualStyleId: visualStyleId ?? "",
      isDefaultLighting: !!isDefaultLighting,
      defaultLightingType,
      brightness,
      contrast,
      sunId: sunId ?? ""
    };
  }
  convertWipeout(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const version = libredwg.dwg_dynapi_entity_data(entity, "class_version");
    const position = libredwg.dwg_dynapi_entity_data(entity, "pt0");
    const uPixel = libredwg.dwg_dynapi_entity_data(entity, "uvec");
    const vPixel = libredwg.dwg_dynapi_entity_data(entity, "vvec");
    const imageSize = libredwg.dwg_dynapi_entity_data(entity, "image_size");
    const flags = libredwg.dwg_dynapi_entity_data(entity, "display_props");
    const clipping = libredwg.dwg_dynapi_entity_data(entity, "clipping");
    const brightness = libredwg.dwg_dynapi_entity_data(entity, "brightness");
    const contrast = libredwg.dwg_dynapi_entity_data(entity, "contrast");
    const fade = libredwg.dwg_dynapi_entity_data(entity, "fade");
    const clipMode = libredwg.dwg_dynapi_entity_data(entity, "clip_mode");
    const clippingBoundaryType = libredwg.dwg_dynapi_entity_data(entity, "clip_boundary_type");
    const countBoundaryPoints = libredwg.dwg_dynapi_entity_data(entity, "num_clip_verts");
    const clip_verts = libredwg.dwg_dynapi_entity_data(entity, "clip_verts");
    const clippingBoundaryPath = libredwg.dwg_ptr_to_point2d_array(
      clip_verts,
      countBoundaryPoints
    );
    const imagedef_ref = libredwg.dwg_dynapi_entity_data(entity, "imagedef");
    const imageDefHandle = libredwg.dwg_ref_get_absref(imagedef_ref) ?? 0;
    const imagedefreactor_ref = libredwg.dwg_dynapi_entity_data(entity, "imagedefreactor");
    const imageDefReactorHandle = libredwg.dwg_ref_get_absref(imagedefreactor_ref) ?? 0;
    return {
      type: "WIPEOUT",
      ...commonAttrs,
      version,
      position,
      uPixel,
      vPixel,
      imageSize,
      imageDefHandle,
      flags,
      clipping,
      brightness,
      contrast,
      fade,
      imageDefReactorHandle,
      clippingBoundaryType,
      countBoundaryPoints,
      clippingBoundaryPath,
      clipMode
    };
  }
  convertXline(entity, commonAttrs) {
    const libredwg = this.libredwg;
    const firstPoint = libredwg.dwg_dynapi_entity_data(entity, "point");
    const unitDirection = libredwg.dwg_dynapi_entity_data(entity, "vector");
    return {
      type: "XLINE",
      ...commonAttrs,
      firstPoint,
      unitDirection
    };
  }
  getDimensionCommonAttrs(entity) {
    const libredwg = this.libredwg;
    const version = libredwg.dwg_dynapi_entity_data(entity, "class_version");
    const name = libredwg.dwg_entity_get_block_name(entity, "block");
    const definitionPoint = libredwg.dwg_dynapi_entity_data(entity, "def_pt");
    const textPoint = libredwg.dwg_dynapi_entity_data(entity, "text_midpt");
    const attachmentPoint = libredwg.dwg_dynapi_entity_data(entity, "attachmentPoint");
    const dimensionType = libredwg.dwg_dynapi_entity_data(entity, "flag");
    const textLineSpacingStyle = libredwg.dwg_dynapi_entity_data(entity, "lspace_factor");
    const textLineSpacingFactor = libredwg.dwg_dynapi_entity_data(entity, "lspace_factor");
    const measurement = libredwg.dwg_dynapi_entity_data(entity, "act_measurement");
    const text = libredwg.dwg_dynapi_entity_data(entity, "user_text");
    const textRotation = libredwg.dwg_dynapi_entity_data(entity, "text_rotation");
    const ocsRotation = libredwg.dwg_dynapi_entity_data(entity, "ins_rotation");
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, "extrusion");
    const styleName = libredwg.dwg_entity_get_dimstyle_name(entity);
    return {
      type: "DIMENSION",
      version,
      name,
      definitionPoint,
      textPoint,
      dimensionType,
      attachmentPoint,
      textLineSpacingStyle,
      textLineSpacingFactor: textLineSpacingFactor || 1,
      measurement,
      text,
      textRotation,
      ocsRotation,
      extrusionDirection,
      styleName
    };
  }
  getCommonAttrs(entity) {
    const libredwg = this.libredwg;
    const color = libredwg.dwg_object_entity_get_color_object(entity);
    const method = color.method;
    const colorIndex = color.index;
    let rgbColor = void 0;
    if (method == 194 || (color.rgb >>> 24 & 255) === 194) {
      rgbColor = color.rgb & 16777215;
    }
    const layer = this.getLayerName(entity);
    const handle = libredwg.dwg_object_entity_get_handle_object(entity);
    const ownerhandle = libredwg.dwg_object_entity_get_ownerhandle_object(entity);
    const ownerDictionaryHardId = libredwg.dwg_object_entity_get_xdicobjhandle_object(entity);
    const lineType = this.getLtypeName(entity);
    const lineweight = libredwg.dwg_object_entity_get_line_weight(entity);
    const lineTypeScale = libredwg.dwg_object_entity_get_ltype_scale(entity);
    const isVisible = !libredwg.dwg_object_entity_get_invisible(entity);
    const xdata = libredwg.dwg_object_entity_get_xdata(entity);
    return {
      handle: idToString(handle.value),
      ownerDictionaryHardId: idToString(ownerDictionaryHardId.absolute_ref),
      ownerBlockRecordSoftId: idToString(ownerhandle.absolute_ref),
      layer,
      color: rgbColor,
      colorIndex,
      colorName: color.name,
      lineType,
      lineweight,
      lineTypeScale,
      isVisible,
      transparency: color.alpha,
      transparencyType: color.alpha_type,
      xdata
    };
  }
  getLayerName(entity) {
    const libredwg = this.libredwg;
    const layer = libredwg.dwg_object_entity_get_layer_object_ref(entity);
    const name = this.layers.get(idToString(layer.handleref.value));
    return name ?? "0";
  }
  getLtypeName(entity) {
    const libredwg = this.libredwg;
    const ltype = libredwg.dwg_object_entity_get_ltype_object_ref(entity);
    const name = this.ltypes.get(idToString(ltype.handleref.value));
    return name ?? "";
  }
}
class LibreDwgConverter {
  constructor(instance) {
    __publicField(this, "libredwg");
    __publicField(this, "entityConverter");
    /**
     * Entity object indices keyed by owning BLOCK_HEADER object pointer.
     * Built lazily when an ownership walk returns no entities (LibreDWG
     * https://github.com/LibreDWG/libredwg/issues/1199).
     */
    __publicField(this, "orphanEntitiesByBlock", null);
    /** Entity indices whose ownerhandle does not resolve to any object. */
    __publicField(this, "ownerlessOrphanIndices", null);
    __publicField(this, "orphanIndexDataPtr", null);
    this.libredwg = instance;
    this.entityConverter = new LibreEntityConverter(instance);
  }
  convert(data) {
    var _a;
    this.entityConverter.clear();
    this.orphanEntitiesByBlock = null;
    this.ownerlessOrphanIndices = null;
    this.orphanIndexDataPtr = data;
    const db = {
      tables: {
        APPID: {
          entries: []
        },
        BLOCK_RECORD: {
          entries: []
        },
        DIMSTYLE: {
          entries: []
        },
        LAYER: {
          entries: []
        },
        LTYPE: {
          entries: []
        },
        STYLE: {
          entries: []
        },
        VPORT: {
          entries: []
        }
      },
      objects: {
        DICTIONARY: [],
        IMAGEDEF: [],
        LAYER_FILTER: [],
        LAYER_INDEX: [],
        LAYOUT: [],
        MLEADERSTYLE: [],
        SPATIAL_FILTER: [],
        XRECORD: []
      },
      header: {},
      entities: [],
      classes: []
    };
    const libredwg = this.libredwg;
    this.convertHeader(data, db.header);
    this.convertClasses(data, db.classes);
    this.entityConverter.setClasses(db.classes);
    const num_objects = libredwg.dwg_get_num_objects(data);
    for (let i = 0; i < num_objects; i++) {
      const obj = libredwg.dwg_get_object(data, i);
      if (obj) {
        const tio = this.safeObjectTio(obj);
        if (tio) {
          const fixedtype = libredwg.dwg_object_get_fixedtype(obj);
          switch (fixedtype) {
            case Dwg_Object_Type.DWG_TYPE_LAYER:
              {
                const layer = this.convertLayer(tio, obj);
                db.tables.LAYER.entries.push(layer);
                this.entityConverter.layers.set(layer.handle, layer.name);
              }
              break;
            case Dwg_Object_Type.DWG_TYPE_LTYPE:
              {
                const ltype = this.convertLineType(tio, obj);
                db.tables.LTYPE.entries.push(ltype);
                this.entityConverter.ltypes.set(ltype.handle, ltype.name);
              }
              break;
          }
        }
      }
    }
    for (let i = 0; i < num_objects; i++) {
      const obj = libredwg.dwg_get_object(data, i);
      if (obj) {
        const tio = this.safeObjectTio(obj);
        if (tio) {
          const fixedtype = libredwg.dwg_object_get_fixedtype(obj);
          switch (fixedtype) {
            case Dwg_Object_Type.DWG_TYPE_APPID:
              db.tables.APPID.entries.push(this.convertAppId(tio));
              break;
            case Dwg_Object_Type.DWG_TYPE_BLOCK_HEADER:
              {
                const btr = this.convertBlockRecord(tio, obj);
                db.tables.BLOCK_RECORD.entries.push(btr);
                if (isModelSpace(btr.name) || isPaperSpace(btr.name)) {
                  btr.entities.forEach((entity) => {
                    db.entities.push(entity);
                    if (entity.type === "INSERT") {
                      entity.attribs.forEach((attrib) => {
                        db.entities.push(attrib);
                      });
                    }
                  });
                }
              }
              break;
            case Dwg_Object_Type.DWG_TYPE_DIMSTYLE:
              db.tables.DIMSTYLE.entries.push(this.convertDimStyle(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_STYLE:
              db.tables.STYLE.entries.push(this.convertStyle(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_VPORT:
              db.tables.VPORT.entries.push(this.convertViewport(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_DICTIONARY:
              db.objects.DICTIONARY.push(this.convertDictionary(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_IMAGEDEF:
              db.objects.IMAGEDEF.push(this.convertImageDef(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_LAYERFILTER:
              db.objects.LAYER_FILTER.push(this.convertLayerFilter(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_LAYER_INDEX:
              db.objects.LAYER_INDEX.push(this.convertLayerIndex(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_LAYOUT:
              db.objects.LAYOUT.push(this.convertLayout(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_MLEADERSTYLE:
              db.objects.MLEADERSTYLE.push(this.convertMLeaderStyle(tio, obj));
              break;
            case Dwg_Object_Type.DWG_TYPE_SPATIAL_FILTER:
              db.objects.SPATIAL_FILTER.push(
                this.convertSpatialFilter(tio, obj)
              );
              break;
            case Dwg_Object_Type.DWG_TYPE_XRECORD:
              db.objects.XRECORD.push(this.convertXRecord(tio, obj));
              break;
          }
        }
      }
    }
    const viewportEntities = db.entities.filter(
      (entity) => entity.type === "VIEWPORT"
    );
    viewportEntities.sort((a, b) => {
      const handleA = parseInt(a.handle, 16);
      const handleB = parseInt(b.handle, 16);
      return handleA - handleB;
    });
    viewportEntities.forEach((viewport, index) => {
      viewport.viewportId = index + 1;
    });
    const thumbnail = libredwg.dwg_bmp(data);
    if ((_a = thumbnail == null ? void 0 : thumbnail.data) == null ? void 0 : _a.length) {
      db.thumbnailImage = thumbnail.data;
    }
    return db;
  }
  getConversionStats() {
    return {
      unknownEntityCount: this.entityConverter.unknownEntityCount
    };
  }
  safeObjectTio(obj) {
    const libredwg = this.libredwg;
    try {
      if (libredwg.dwg_object_get_supertype(obj) != Dwg_Object_Supertype.DWG_SUPERTYPE_OBJECT) {
        return null;
      }
      const tio = libredwg.dwg_object_to_object_tio(obj);
      return tio ? tio : null;
    } catch {
      return null;
    }
  }
  convertHeader(data, header) {
    const libredwg = this.libredwg;
    HEADER_VARIABLES.forEach((name) => {
      let var_name = name;
      if (name == "DIMBLK" || name == "DIMBLK1" || name == "DIMBLK2") {
        var_name = var_name + "_T";
      }
      let value = libredwg.dwg_dynapi_header_data(data, var_name);
      if (name == "CELTYPE" || name == "CLAYER" || name == "CLAYER" || name == "DIMSTYLE" || name == "DIMTXSTY" || name == "TEXTSTYLE") {
        value = value ? libredwg.dwg_ref_get_object_name(value) : "";
      } else if (name == "DRAGVS") {
        value = value ? libredwg.dwg_ref_get_absref(value) ?? 2 : 2;
      }
      header[name] = value;
    });
  }
  convertClasses(data, classes) {
    const libredwg = this.libredwg;
    const count = libredwg.dwg_get_num_classes(data);
    for (let index = 0; index < count; index++) {
      const cls = libredwg.dwg_get_class(data, index);
      classes.push({
        dxfName: cls.dxfname,
        cppName: cls.cppname,
        appName: cls.appname,
        capabilitiesFlag: cls.proxyflag,
        instanceCount: cls.num_instances,
        wasAProxyFlag: cls.s_zombie,
        // DWG_TYPE_PROXY_ENTITY = 0x1F2 /* 498 */,
        // DWG_TYPE_PROXY_OBJECT = 0x1F3 /* 499 */,
        isAnEntityFlag: cls.item_class_id === 498
      });
    }
  }
  convertAppId(item) {
    const libredwg = this.libredwg;
    const name = libredwg.dwg_dynapi_entity_data(item, "name");
    const flag = libredwg.dwg_dynapi_entity_data(item, "flag");
    return {
      name,
      standardFlag: flag
    };
  }
  convertBlockRecord(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const block = libredwg.dwg_entity_block_header_get_block(item);
    if (block.name) {
      commonAttrs.name = block.name;
    }
    const num_owned = libredwg.dwg_dynapi_entity_data(item, "num_owned");
    const flags = libredwg.dwg_dynapi_entity_data(item, "flag");
    const description = libredwg.dwg_dynapi_entity_data(item, "description");
    const basePoint = libredwg.dwg_dynapi_entity_data(item, "base_pt");
    const insertionUnits = libredwg.dwg_dynapi_entity_data(item, "insert_units");
    const explodability = libredwg.dwg_dynapi_entity_data(item, "explodable");
    const scalability = libredwg.dwg_dynapi_entity_data(item, "block_scaling");
    const layout_ptr = libredwg.dwg_dynapi_entity_data(item, "layout");
    const layout = libredwg.dwg_ref_get_id(layout_ptr) ?? "";
    let bmpPreview;
    const bmpPreviewBinaryData = libredwg.dwg_entity_block_header_get_preview(item);
    if (bmpPreviewBinaryData && bmpPreviewBinaryData.length > 0) {
      bmpPreview = uint8ArrayToHexString(bmpPreviewBinaryData);
    }
    let entities = this.convertEntities(obj, commonAttrs.handle);
    if (!entities || entities.length == 0) {
      entities = [];
      const entities_ptr = libredwg.dwg_dynapi_entity_data(item, "entities");
      if (entities_ptr) {
        const object_ref_ptr_array = libredwg.dwg_ptr_to_object_ref_ptr_array(
          entities_ptr,
          num_owned
        );
        const converter = this.entityConverter;
        for (let index = 0; index < num_owned; index++) {
          const object = libredwg.dwg_ref_get_object(
            object_ref_ptr_array[index]
          );
          const entity = converter.convert(object);
          if (entity) {
            entity.ownerBlockRecordSoftId = commonAttrs.handle;
            entities.push(entity);
          }
        }
      }
    }
    if (this.orphanIndexDataPtr != null) {
      const orphans = this.convertOrphanOwnedEntities(
        this.orphanIndexDataPtr,
        obj,
        commonAttrs.handle,
        isModelSpace(commonAttrs.name) === true
      );
      if (orphans.length) {
        if (entities.length === 0) {
          entities = orphans;
        } else {
          const seen = new Set(entities.map((e) => e.handle));
          for (const entity of orphans) {
            if (!seen.has(entity.handle)) {
              entities.push(entity);
            }
          }
        }
      }
    }
    return {
      ...commonAttrs,
      flags,
      description,
      basePoint,
      layout,
      insertionUnits,
      explodability,
      scalability,
      bmpPreview,
      entities
    };
  }
  convertEntities(obj, ownerHandle) {
    const libredwg = this.libredwg;
    const converter = this.entityConverter;
    const entities = [];
    let next = libredwg.get_first_owned_entity(obj);
    while (next) {
      const entity = converter.convert(next);
      if (entity) {
        entity.ownerBlockRecordSoftId = ownerHandle;
        entities.push(entity);
      }
      next = libredwg.get_next_owned_entity(obj, next);
    }
    return entities;
  }
  /**
   * Builds (once) a map of BLOCK_HEADER object pointer → entity object indices
   * for entities that are not reachable through the ownership chain, then
   * converts the entities owned by `blockHeaderPtr`.
   *
   * @param includeOwnerless - When true (only for *Model_Space), also convert
   *   entities that still have no resolvable owner after ownerhandle + entmode
   *   fallback via dwg_entity_owner.
   */
  convertOrphanOwnedEntities(data, blockHeaderPtr, ownerHandle, includeOwnerless) {
    this.ensureOrphanEntityIndex(data);
    const byBlock = this.orphanEntitiesByBlock ?? /* @__PURE__ */ new Map();
    const owned = byBlock.get(blockHeaderPtr) ?? [];
    const ownerless = includeOwnerless && this.ownerlessOrphanIndices ? this.ownerlessOrphanIndices : [];
    const indices = owned.length && ownerless.length ? owned.concat(ownerless) : owned.length ? owned : ownerless;
    if (indices.length === 0) {
      return [];
    }
    const libredwg = this.libredwg;
    const converter = this.entityConverter;
    const entities = [];
    for (const index of indices) {
      const object = libredwg.dwg_get_object(data, index);
      const entity = converter.convert(object);
      if (entity) {
        entity.ownerBlockRecordSoftId = ownerHandle;
        entities.push(entity);
      }
    }
    return entities;
  }
  ensureOrphanEntityIndex(data) {
    if (this.orphanEntitiesByBlock) {
      return;
    }
    const libredwg = this.libredwg;
    const numObjects = libredwg.dwg_get_num_objects(data);
    const indexByEntityPtr = /* @__PURE__ */ new Map();
    const entityIndices = [];
    const blockHeaderPtrs = [];
    const blockObjByTio = /* @__PURE__ */ new Map();
    for (let i = 0; i < numObjects; i++) {
      const obj = libredwg.dwg_get_object(data, i);
      if (!obj) continue;
      if (libredwg.dwg_object_get_supertype(obj) === Dwg_Object_Supertype.DWG_SUPERTYPE_ENTITY) {
        entityIndices.push(i);
        indexByEntityPtr.set(obj, i);
      } else if (libredwg.dwg_object_get_fixedtype(obj) === Dwg_Object_Type.DWG_TYPE_BLOCK_HEADER) {
        blockHeaderPtrs.push(obj);
        const tio = libredwg.dwg_object_to_object_tio(obj);
        if (tio) blockObjByTio.set(tio, obj);
      }
    }
    const claimed = /* @__PURE__ */ new Set();
    for (const blockHeader of blockHeaderPtrs) {
      let current = libredwg.get_first_owned_entity(blockHeader);
      let steps = 0;
      while (current && steps++ <= entityIndices.length) {
        const index = indexByEntityPtr.get(current);
        if (index === void 0 || claimed.has(index)) break;
        claimed.add(index);
        current = libredwg.get_next_owned_entity(blockHeader, current);
      }
    }
    const orphansByBlock = /* @__PURE__ */ new Map();
    const ownerless = [];
    for (const index of entityIndices) {
      if (claimed.has(index)) continue;
      const obj = libredwg.dwg_get_object(data, index);
      const etio = obj ? libredwg.dwg_object_to_entity_tio(obj) : 0;
      const ownerTio = etio ? libredwg.dwg_entity_owner(etio) : 0;
      const owner = ownerTio ? blockObjByTio.get(ownerTio) ?? 0 : 0;
      if (owner) {
        const owned = orphansByBlock.get(owner);
        if (owned) owned.push(index);
        else orphansByBlock.set(owner, [index]);
      } else {
        ownerless.push(index);
      }
    }
    this.orphanEntitiesByBlock = orphansByBlock;
    this.ownerlessOrphanIndices = ownerless;
  }
  convertDimStyle(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const DIMTOL = libredwg.dwg_dynapi_entity_data(item, "DIMTOL");
    const DIMLIM = libredwg.dwg_dynapi_entity_data(item, "DIMLIM");
    const DIMTIH = libredwg.dwg_dynapi_entity_data(item, "DIMTIH");
    const DIMTOH = libredwg.dwg_dynapi_entity_data(item, "DIMTOH");
    const DIMSE1 = libredwg.dwg_dynapi_entity_data(item, "DIMSE1");
    const DIMSE2 = libredwg.dwg_dynapi_entity_data(item, "DIMSE2");
    const DIMALT = libredwg.dwg_dynapi_entity_data(item, "DIMALT");
    const DIMTOFL = libredwg.dwg_dynapi_entity_data(item, "DIMTOFL");
    const DIMSAH = libredwg.dwg_dynapi_entity_data(item, "DIMSAH");
    const DIMTIX = libredwg.dwg_dynapi_entity_data(item, "DIMTIX");
    const DIMSOXD = libredwg.dwg_dynapi_entity_data(item, "DIMSOXD");
    const DIMALTD = libredwg.dwg_dynapi_entity_data(item, "DIMALTD");
    const DIMZIN = libredwg.dwg_dynapi_entity_data(item, "DIMZIN");
    const DIMSD1 = libredwg.dwg_dynapi_entity_data(item, "DIMSD1");
    const DIMSD2 = libredwg.dwg_dynapi_entity_data(item, "DIMSD2");
    const DIMTOLJ = libredwg.dwg_dynapi_entity_data(item, "DIMTOLJ");
    const DIMJUST = libredwg.dwg_dynapi_entity_data(item, "DIMJUST");
    const DIMFIT = libredwg.dwg_dynapi_entity_data(item, "DIMFIT");
    const DIMUPT = libredwg.dwg_dynapi_entity_data(item, "DIMUPT");
    const DIMTZIN = libredwg.dwg_dynapi_entity_data(item, "DIMTZIN");
    const DIMALTZ = libredwg.dwg_dynapi_entity_data(item, "DIMALTZ");
    const DIMALTTZ = libredwg.dwg_dynapi_entity_data(item, "DIMALTTZ");
    const DIMTAD = libredwg.dwg_dynapi_entity_data(item, "DIMTAD");
    const DIMUNIT = libredwg.dwg_dynapi_entity_data(item, "DIMUNIT");
    const DIMAUNIT = libredwg.dwg_dynapi_entity_data(item, "DIMAUNIT");
    const DIMDEC = libredwg.dwg_dynapi_entity_data(item, "DIMDEC");
    const DIMTDEC = libredwg.dwg_dynapi_entity_data(item, "DIMTDEC");
    const DIMALTU = libredwg.dwg_dynapi_entity_data(item, "DIMALTU");
    const DIMALTTD = libredwg.dwg_dynapi_entity_data(item, "DIMALTTD");
    const DIMSCALE = libredwg.dwg_dynapi_entity_data(item, "DIMSCALE");
    const DIMASZ = libredwg.dwg_dynapi_entity_data(item, "DIMASZ");
    const DIMEXO = libredwg.dwg_dynapi_entity_data(item, "DIMEXO");
    const DIMDLI = libredwg.dwg_dynapi_entity_data(item, "DIMDLI");
    const DIMEXE = libredwg.dwg_dynapi_entity_data(item, "DIMEXE");
    const DIMRND = libredwg.dwg_dynapi_entity_data(item, "DIMRND");
    const DIMDLE = libredwg.dwg_dynapi_entity_data(item, "DIMDLE");
    const DIMTP = libredwg.dwg_dynapi_entity_data(item, "DIMTP");
    const DIMTM = libredwg.dwg_dynapi_entity_data(item, "DIMTM");
    const DIMFXL = libredwg.dwg_dynapi_entity_data(item, "DIMFXL");
    const DIMJOGANG = libredwg.dwg_dynapi_entity_data(item, "DIMJOGANG");
    const DIMTFILL = libredwg.dwg_dynapi_entity_data(item, "DIMTFILL");
    const DIMTFILLCLR = libredwg.dwg_dynapi_entity_data(item, "DIMTFILLCLR");
    const DIMAZIN = libredwg.dwg_dynapi_entity_data(item, "DIMAZIN");
    const DIMARCSYM = libredwg.dwg_dynapi_entity_data(item, "DIMARCSYM");
    const DIMTXT = libredwg.dwg_dynapi_entity_data(item, "DIMTXT");
    const DIMCEN = libredwg.dwg_dynapi_entity_data(item, "DIMCEN");
    const DIMTSZ = libredwg.dwg_dynapi_entity_data(item, "DIMTSZ");
    const DIMALTF = libredwg.dwg_dynapi_entity_data(item, "DIMALTF");
    const DIMLFAC = libredwg.dwg_dynapi_entity_data(item, "DIMLFAC");
    const DIMTVP = libredwg.dwg_dynapi_entity_data(item, "DIMTVP");
    const DIMTFAC = libredwg.dwg_dynapi_entity_data(item, "DIMTFAC");
    const DIMGAP = libredwg.dwg_dynapi_entity_data(item, "DIMGAP");
    const DIMPOST = libredwg.dwg_dynapi_entity_data(item, "DIMPOST");
    const DIMAPOST = libredwg.dwg_dynapi_entity_data(item, "DIMAPOST");
    const DIMBLK_T = libredwg.dwg_dynapi_entity_data(item, "DIMBLK_T");
    const DIMBLK1_T = libredwg.dwg_dynapi_entity_data(item, "DIMBLK1_T");
    const DIMBLK2_T = libredwg.dwg_dynapi_entity_data(item, "DIMBLK2_T");
    const DIMALTRND = libredwg.dwg_dynapi_entity_data(item, "DIMALTRND");
    const DIMCLRD_N = libredwg.dwg_dynapi_entity_data(item, "DIMCLRD_N");
    const DIMCLRE_N = libredwg.dwg_dynapi_entity_data(item, "DIMCLRE_N");
    const DIMCLRT_N = libredwg.dwg_dynapi_entity_data(item, "DIMCLRT_N");
    const DIMCLRD = libredwg.dwg_dynapi_entity_data(item, "DIMCLRD");
    const DIMCLRE = libredwg.dwg_dynapi_entity_data(item, "DIMCLRE");
    const DIMCLRT = libredwg.dwg_dynapi_entity_data(item, "DIMCLRT");
    const DIMADEC = libredwg.dwg_dynapi_entity_data(item, "DIMADEC");
    const DIMFRAC = libredwg.dwg_dynapi_entity_data(item, "DIMFRAC");
    const DIMLUNIT = libredwg.dwg_dynapi_entity_data(item, "DIMLUNIT");
    const DIMDSEP = libredwg.dwg_dynapi_entity_data(item, "DIMDSEP");
    const DIMTMOVE = libredwg.dwg_dynapi_entity_data(item, "DIMTMOVE");
    const DIMATFIT = libredwg.dwg_dynapi_entity_data(item, "DIMATFIT");
    const DIMFXLON = libredwg.dwg_dynapi_entity_data(item, "DIMFXLON");
    const DIMTXTDIRECTION = libredwg.dwg_dynapi_entity_data(item, "DIMTXTDIRECTION");
    const DIMALTMZF = libredwg.dwg_dynapi_entity_data(item, "DIMALTMZF");
    const DIMALTMZS = libredwg.dwg_dynapi_entity_data(item, "DIMALTMZS");
    const DIMMZF = libredwg.dwg_dynapi_entity_data(item, "DIMMZF");
    const DIMMZS = libredwg.dwg_dynapi_entity_data(item, "DIMMZS");
    const DIMLWD = libredwg.dwg_dynapi_entity_data(item, "DIMLWD");
    const DIMLWE = libredwg.dwg_dynapi_entity_data(item, "DIMLWE");
    const DIMTXSTY_Ptr = libredwg.dwg_dynapi_entity_data(item, "DIMTXSTY");
    const DIMTXSTY = libredwg.dwg_ref_get_absref(DIMTXSTY_Ptr) ?? void 0;
    const DIMLDRBLK_Ptr = libredwg.dwg_dynapi_entity_data(item, "DIMLDRBLK");
    const DIMLDRBLK = libredwg.dwg_ref_get_absref(DIMLDRBLK_Ptr) ?? void 0;
    return {
      ...commonAttrs,
      DIMPOST,
      DIMAPOST,
      DIMBLK: DIMBLK_T,
      DIMBLK1: DIMBLK1_T,
      DIMBLK2: DIMBLK2_T,
      DIMSCALE,
      DIMASZ,
      DIMEXO,
      DIMDLI,
      DIMEXE,
      DIMRND,
      DIMDLE,
      DIMTP,
      DIMTM,
      DIMTXT,
      DIMCEN,
      DIMTSZ,
      DIMALTF,
      DIMLFAC,
      DIMTVP,
      DIMTFAC,
      DIMGAP,
      DIMALTRND,
      DIMTOL,
      DIMLIM,
      DIMTIH,
      DIMTOH,
      DIMSE1,
      DIMSE2,
      DIMTAD,
      DIMZIN,
      DIMAZIN,
      DIMALT,
      DIMALTD,
      DIMTOFL,
      DIMSAH,
      DIMTIX,
      DIMSOXD,
      DIMCLRD,
      DIMCLRE,
      DIMCLRT,
      DIMADEC,
      DIMUNIT,
      DIMDEC,
      DIMTDEC,
      DIMALTU,
      DIMALTTD,
      DIMAUNIT,
      DIMFRAC,
      DIMLUNIT,
      DIMDSEP: String.fromCharCode(DIMDSEP),
      DIMTMOVE,
      DIMJUST,
      DIMSD1,
      DIMSD2,
      DIMTOLJ,
      DIMTZIN,
      DIMALTZ,
      DIMALTTZ,
      DIMFIT,
      DIMUPT,
      DIMATFIT,
      DIMTXSTY,
      DIMLDRBLK,
      DIMLWD,
      DIMLWE,
      DIMFXL,
      DIMJOGANG,
      DIMTFILL,
      DIMTFILLCLR,
      DIMARCSYM,
      DIMCLRD_N,
      DIMCLRE_N,
      DIMCLRT_N,
      DIMFXLON,
      DIMTXTDIRECTION,
      DIMALTMZF,
      DIMALTMZS,
      DIMMZF,
      DIMMZS
    };
  }
  convertLayer(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const flag = libredwg.dwg_dynapi_entity_data(item, "flag");
    const frozen = libredwg.dwg_dynapi_entity_data(item, "frozen");
    const off = libredwg.dwg_dynapi_entity_data(item, "off");
    const frozenInNew = libredwg.dwg_dynapi_entity_data(item, "frozen_in_new");
    const locked = libredwg.dwg_dynapi_entity_data(item, "plotflockedlag");
    const plotFlag = libredwg.dwg_dynapi_entity_data(item, "plotflag");
    const linewt = libredwg.dwg_dynapi_entity_data(item, "linewt");
    const color = libredwg.dwg_dynapi_entity_data(item, "color");
    const ltypeRef = libredwg.dwg_dynapi_entity_data(item, "ltype");
    let ltypeName = "Continuous";
    if (ltypeRef) {
      try {
        ltypeName = libredwg.dwg_ref_get_object_name(ltypeRef);
      } catch {
      }
    }
    const method = color.method;
    let colorIndex = 256;
    let rgbColor = 16777215;
    if (method === 195 || (color.rgb >>> 24 & 255) === 195) {
      colorIndex = color.rgb & 255;
    } else if (method == 194 || (color.rgb >>> 24 & 255) === 194) {
      rgbColor = color.rgb & 16777215;
    } else if (color.index >= 1 && color.index <= 255) {
      colorIndex = color.index;
    }
    return {
      ...commonAttrs,
      standardFlag: flag,
      colorIndex,
      color: rgbColor,
      colorName: color.name,
      transparency: color.alpha,
      lineType: ltypeName,
      frozen: frozen != 0,
      off: off != 0,
      frozenInNew: frozenInNew != 0,
      locked: locked != 0,
      plotFlag,
      lineweight: linewt,
      plotStyleNameObjectId: "",
      materialObjectId: ""
    };
  }
  convertLineType(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const flag = libredwg.dwg_dynapi_entity_data(item, "flag");
    const description = libredwg.dwg_dynapi_entity_data(item, "description");
    const numDashes = libredwg.dwg_dynapi_entity_data(item, "numdashes");
    const patternLen = libredwg.dwg_dynapi_entity_data(item, "pattern_len");
    const dashes = libredwg.dwg_dynapi_entity_data(item, "dashes");
    const dashArray = dashes ? libredwg.dwg_ptr_to_ltype_dash_array(dashes, numDashes) : [];
    return {
      ...commonAttrs,
      description,
      standardFlag: flag,
      numberOfLineTypes: numDashes,
      totalPatternLength: patternLen,
      pattern: this.convertLineTypePattern(dashArray)
    };
  }
  convertLineTypePattern(dashes) {
    const patterns = [];
    dashes.forEach((dash) => {
      patterns.push({
        elementLength: dash.length || 0,
        elementTypeFlag: dash.complex_shapecode,
        shapeNumber: dash.shape_flag,
        // TODO: convert style handle to style object id
        // styleObjectId: dash.style,
        scale: dash.scale,
        rotation: dash.rotation,
        offsetX: dash.x_offset,
        offsetY: dash.y_offset,
        text: dash.text
      });
    });
    return patterns;
  }
  convertStyle(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const standardFlag = libredwg.dwg_dynapi_entity_data(item, "flag");
    const widthFactor = libredwg.dwg_dynapi_entity_data(item, "width_factor");
    const obliqueAngle = libredwg.dwg_dynapi_entity_data(item, "oblique_angle");
    const textGenerationFlag = libredwg.dwg_dynapi_entity_data(item, "generation");
    const lastHeight = libredwg.dwg_dynapi_entity_data(item, "last_height");
    const font = libredwg.dwg_dynapi_entity_data(item, "font_file");
    const bigFont = libredwg.dwg_dynapi_entity_data(item, "bigfont_file");
    return {
      ...commonAttrs,
      standardFlag,
      fixedTextHeight: 0,
      // TODO: Set the correct value
      widthFactor,
      obliqueAngle,
      textGenerationFlag,
      lastHeight,
      font,
      bigFont
    };
  }
  convertViewport(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
    const standardFlag = libredwg.dwg_dynapi_entity_data(item, "flag");
    const viewHeight = libredwg.dwg_dynapi_entity_data(item, "VIEWSIZE");
    const aspectRatio = libredwg.dwg_dynapi_entity_data(item, "aspect_ratio");
    const center = libredwg.dwg_dynapi_entity_data(item, "VIEWCTR");
    const viewTarget = libredwg.dwg_dynapi_entity_data(item, "view_target");
    const viewDirectionFromTarget = libredwg.dwg_dynapi_entity_data(item, "VIEWDIR");
    const viewTwistAngle = libredwg.dwg_dynapi_entity_data(item, "view_twist");
    const lensLength = libredwg.dwg_dynapi_entity_data(item, "lens_length");
    const frontClippingPlane = libredwg.dwg_dynapi_entity_data(item, "front_clip_z");
    const backClippingPlane = libredwg.dwg_dynapi_entity_data(item, "back_clip_z");
    const viewMode = libredwg.dwg_dynapi_entity_data(item, "VIEWMODE");
    const renderMode = libredwg.dwg_dynapi_entity_data(item, "render_mode");
    const isDefaultLightingOn = libredwg.dwg_dynapi_entity_data(item, "use_default_lights") != 0;
    const defaultLightningType = libredwg.dwg_dynapi_entity_data(item, "default_lightning_type");
    const brightness = libredwg.dwg_dynapi_entity_data(item, "brightness");
    const contrast = libredwg.dwg_dynapi_entity_data(item, "contrast");
    const ambient_color = libredwg.dwg_dynapi_entity_data(item, "ambient_color");
    const lowerLeftCorner = libredwg.dwg_dynapi_entity_data(item, "lower_left");
    const upperRightCorner = libredwg.dwg_dynapi_entity_data(item, "upper_right");
    const circleSides = libredwg.dwg_dynapi_entity_data(item, "circle_zoom");
    const ucsIconSetting = libredwg.dwg_dynapi_entity_data(item, "UCSICON");
    const gridSpacing = libredwg.dwg_dynapi_entity_data(item, "GRIDUNIT");
    const snapRotationAngle = libredwg.dwg_dynapi_entity_data(item, "SNAPANG");
    const snapBasePoint = libredwg.dwg_dynapi_entity_data(item, "SNAPBASE");
    const snapSpacing = libredwg.dwg_dynapi_entity_data(item, "SNAPUNIT");
    const ucsOrigin = libredwg.dwg_dynapi_entity_data(item, "ucsorg");
    const ucsXAxis = libredwg.dwg_dynapi_entity_data(item, "ucsxdir");
    const ucsYAxis = libredwg.dwg_dynapi_entity_data(item, "ucsydir");
    const elevation = libredwg.dwg_dynapi_entity_data(item, "ucs_elevation");
    const majorGridLines = libredwg.dwg_dynapi_entity_data(item, "grid_major");
    const background = libredwg.dwg_dynapi_entity_data(item, "background");
    const backgroundObjectId = background ? libredwg.dwg_ref_get_id(background) ?? "" : void 0;
    const visualstyle = libredwg.dwg_dynapi_entity_data(item, "visualstyle");
    const visualStyleObjectId = visualstyle ? libredwg.dwg_ref_get_id(visualstyle) ?? "" : void 0;
    return {
      ...commonAttrs,
      standardFlag,
      lowerLeftCorner,
      upperRightCorner,
      center,
      snapBasePoint,
      snapSpacing,
      gridSpacing,
      viewDirectionFromTarget,
      viewTarget,
      lensLength,
      frontClippingPlane,
      backClippingPlane,
      viewHeight,
      aspectRatio,
      snapRotationAngle,
      viewTwistAngle,
      circleSides,
      frozenLayers: [],
      // TODO: Set the correct value
      styleSheet: "",
      // TODO: Set the correct value
      renderMode,
      viewMode,
      ucsIconSetting,
      ucsOrigin,
      ucsXAxis,
      ucsYAxis,
      orthographicType: 0,
      // TODO: Set the correct value
      elevation,
      shadePlotSetting: 0,
      // TODO: Set the correct value
      majorGridLines,
      backgroundObjectId,
      // shadePlotObjectId: undefined,
      visualStyleObjectId,
      isDefaultLightingOn,
      defaultLightingType: defaultLightningType,
      brightness,
      contrast,
      // TODO: Not sure whether 'index' or 'rgb' should be used
      ambientColor: ambient_color.index
    };
  }
  getCommonTableEntryAttrs(tio, obj) {
    const libredwg = this.libredwg;
    const object_tio = libredwg.dwg_object_get_tio(obj);
    const ownerhandle = libredwg.dwg_object_object_get_ownerhandle_object(object_tio);
    const handle = libredwg.dwg_object_get_handle_object(obj);
    return {
      handle: idToString(handle.value),
      ownerHandle: idToString(ownerhandle.absolute_ref),
      name: libredwg.dwg_dynapi_entity_data(tio, "name")
    };
  }
  convertDictionary(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const isHardOwner = libredwg.dwg_dynapi_entity_data(item, "is_hardowner");
    const cloningFlag = libredwg.dwg_dynapi_entity_data(item, "cloning");
    const numitems = libredwg.dwg_dynapi_entity_data(item, "numitems");
    const itemhandles_ptr = libredwg.dwg_dynapi_entity_data(item, "itemhandles");
    const itemhandles = libredwg.dwg_ptr_to_object_ref_array(
      itemhandles_ptr,
      numitems
    );
    const texts = libredwg.dwg_object_dictionary_get_texts(obj);
    const entries = {};
    itemhandles.forEach(
      (handle, index) => entries[texts[index]] = idToString(handle.absolute_ref)
    );
    return {
      ...commonAttrs,
      isHardOwner: !!isHardOwner,
      cloningFlag,
      entries
    };
  }
  convertImageDef(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const size = libredwg.dwg_dynapi_entity_data(item, "image_size");
    const fileName = libredwg.dwg_dynapi_entity_data(item, "file_path");
    const isLoaded = libredwg.dwg_dynapi_entity_data(item, "is_loaded");
    const sizeOfOnePixel = libredwg.dwg_dynapi_entity_data(item, "pixel_size");
    const resolutionUnits = libredwg.dwg_dynapi_entity_data(item, "resunits");
    return {
      ...commonAttrs,
      fileName,
      size,
      sizeOfOnePixel,
      isLoaded,
      resolutionUnits
    };
  }
  convertLayerFilter(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const numNames = libredwg.dwg_dynapi_entity_data(item, "num_names") ?? 0;
    const namesPtr = libredwg.dwg_dynapi_entity_data(item, "names");
    const layerNames = namesPtr && numNames > 0 ? libredwg.dwg_ptr_to_wchar_string_array(namesPtr, numNames).filter((name) => name != null && name !== "") : [];
    return {
      ...commonAttrs,
      ...layerNames.length ? { layerNames } : {}
    };
  }
  convertLayerIndex(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const timeStamp = libredwg.dwg_dynapi_entity_data(item, "last_updated");
    const numEntries = libredwg.dwg_dynapi_entity_data(item, "num_entries") ?? 0;
    const entriesPtr = libredwg.dwg_dynapi_entity_data(item, "entries");
    const entrySize = libredwg.dwg_dynapi_subclass_size("LAYER_entry");
    const layerNames = [];
    const idBufferIds = [];
    const idBufferEntryCounts = [];
    if (entriesPtr && entrySize > 0) {
      for (let i = 0; i < numEntries; i++) {
        const entryPtr = entriesPtr + i * entrySize;
        const name = libredwg.dwg_dynapi_subclass_data(
          entryPtr,
          "LAYER_entry",
          "name"
        );
        layerNames.push(name ?? "");
        const handleRef = libredwg.dwg_dynapi_subclass_data(
          entryPtr,
          "LAYER_entry",
          "handle"
        );
        idBufferIds.push(handleRef ? libredwg.dwg_ref_get_id(handleRef) ?? "" : "");
        idBufferEntryCounts.push(
          libredwg.dwg_dynapi_subclass_data(
            entryPtr,
            "LAYER_entry",
            "numlayers"
          ) ?? 0
        );
      }
    }
    return {
      ...commonAttrs,
      ...timeStamp != null ? { timeStamp } : {},
      ...layerNames.length ? { layerNames } : {},
      ...idBufferIds.length ? { idBufferIds } : {},
      ...idBufferEntryCounts.length ? { idBufferEntryCounts } : {}
    };
  }
  convertLayout(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const layoutName = libredwg.dwg_dynapi_entity_data(item, "layout_name");
    const tabOrder = libredwg.dwg_dynapi_entity_data(item, "tab_order");
    const controlFlag = libredwg.dwg_dynapi_entity_data(item, "layout_flags");
    const insertionPoint = libredwg.dwg_dynapi_entity_data(item, "INSBASE");
    const minLimit = libredwg.dwg_dynapi_entity_data(item, "LIMMIN");
    const maxLimit = libredwg.dwg_dynapi_entity_data(item, "LIMMAX");
    const ucsOrigin = libredwg.dwg_dynapi_entity_data(item, "UCSORG");
    const ucsXAxis = libredwg.dwg_dynapi_entity_data(item, "UCSXDIR");
    const ucsYAxis = libredwg.dwg_dynapi_entity_data(item, "UCSYDIR");
    const orthographicType = libredwg.dwg_dynapi_entity_data(item, "UCSORTHOVIEW");
    const minExtent = libredwg.dwg_dynapi_entity_data(item, "EXTMIN");
    const maxExtent = libredwg.dwg_dynapi_entity_data(item, "EXTMAX");
    const elevation = libredwg.dwg_dynapi_entity_data(item, "ucs_elevation");
    const block_header_ref = libredwg.dwg_dynapi_entity_data(item, "block_header");
    const paperSpaceTableId = libredwg.dwg_ref_get_id(block_header_ref) ?? "";
    const active_viewport_ref = libredwg.dwg_dynapi_entity_data(item, "active_viewport");
    const viewportId = libredwg.dwg_ref_get_id(active_viewport_ref) ?? "";
    const named_ucs_ref = libredwg.dwg_dynapi_entity_data(item, "named_ucs");
    const namedUcsId = named_ucs_ref ? libredwg.dwg_ref_get_id(named_ucs_ref) ?? "" : void 0;
    return {
      ...commonAttrs,
      layoutName,
      controlFlag,
      tabOrder,
      minLimit,
      maxLimit,
      insertionPoint,
      minExtent,
      maxExtent,
      elevation,
      ucsOrigin,
      ucsXAxis,
      ucsYAxis,
      orthographicType,
      paperSpaceTableId,
      viewportId,
      namedUcsId,
      // orthographicUcsId?: string;
      shadePlotId: ""
      // TODO: Set the correct value
    };
  }
  convertMLeaderStyle(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const objectVal = (field) => libredwg.dwg_dynapi_entity_data(item, field);
    const refToId = (ref) => libredwg.dwg_ref_get_id(ref);
    const asBool = (value) => value > 0;
    const mleaderColor = (color) => color != null ? dwgColorToMLeaderRawColor(color) : void 0;
    return {
      ...commonAttrs,
      subclassMarker: "AcDbMLeaderStyle",
      unknown1: objectVal("class_version"),
      contentType: objectVal("content_type"),
      drawMLeaderOrderType: objectVal("mleader_order"),
      drawLeaderOrderType: objectVal("leader_order"),
      maxLeaderSegmentPoints: objectVal("max_points"),
      firstSegmentAngleConstraint: objectVal("first_seg_angle"),
      secondSegmentAngleConstraint: objectVal("second_seg_angle"),
      leaderLineType: objectVal("type"),
      leaderLineColor: mleaderColor(objectVal("line_color")),
      leaderLineTypeId: refToId(objectVal("line_type")),
      leaderLineWeight: objectVal("linewt"),
      landingEnabled: asBool(objectVal("has_landing")),
      landingGap: objectVal("landing_gap"),
      doglegEnabled: asBool(objectVal("has_dogleg")),
      doglegLength: objectVal("landing_dist"),
      description: objectVal("description"),
      arrowheadId: refToId(objectVal("arrow_head")),
      arrowheadSize: objectVal("arrow_head_size"),
      defaultMTextContents: objectVal("text_default"),
      textStyleId: refToId(objectVal("text_style")),
      textLeftAttachmentType: objectVal("attach_left"),
      textAngleType: objectVal("text_angle_type"),
      textAlignmentType: objectVal("text_align_type"),
      textRightAttachmentType: objectVal("attach_right"),
      textColor: mleaderColor(objectVal("text_color")),
      textHeight: objectVal("text_height"),
      textFrameEnabled: asBool(objectVal("has_text_frame")),
      textAlignAlwaysLeft: asBool(objectVal("text_always_left")),
      alignSpace: objectVal("align_space"),
      blockContentId: refToId(objectVal("block")),
      blockContentColor: mleaderColor(objectVal("block_color")),
      blockContentScale: objectVal("block_scale"),
      blockContentScaleEnabled: asBool(objectVal("use_block_scale")),
      blockContentRotation: objectVal("block_rotation"),
      blockContentRotationEnabled: asBool(objectVal("use_block_rotation")),
      blockContentConnectionType: objectVal("block_connection"),
      scale: objectVal("scale"),
      overwritePropertyValue: asBool(objectVal("is_changed")),
      annotative: asBool(objectVal("is_annotative")),
      breakGapSize: objectVal("break_size"),
      textAttachmentDirection: objectVal("attach_dir"),
      bottomTextAttachmentDirection: objectVal("attach_bottom"),
      topTextAttachmentDirection: objectVal("attach_top"),
      unknown2: asBool(objectVal("text_extended"))
    };
  }
  convertSpatialFilter(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const origin = libredwg.dwg_dynapi_entity_data(item, "origin");
    const numberOfPointsOnClipBoundary = libredwg.dwg_dynapi_entity_data(item, "num_clip_verts");
    const clip_verts_ptr = libredwg.dwg_dynapi_entity_data(item, "clip_verts");
    const vertices = libredwg.dwg_ptr_to_point2d_array(
      clip_verts_ptr,
      numberOfPointsOnClipBoundary
    );
    const extrusionDirection = libredwg.dwg_dynapi_entity_data(item, "extrusion");
    const clipBoundaryVisible = libredwg.dwg_dynapi_entity_data(item, "display_boundary_on");
    const frontClippingPlaneFlag = libredwg.dwg_dynapi_entity_data(item, "front_clip_on");
    const frontClippingPlaneDistance = libredwg.dwg_dynapi_entity_data(item, "front_clip_z");
    const backClippingPlaneFlag = libredwg.dwg_dynapi_entity_data(item, "back_clip_on");
    const backClippingPlaneDistance = libredwg.dwg_dynapi_entity_data(item, "back_clip_z");
    const transform_ptr = libredwg.dwg_dynapi_entity_data(item, "transform");
    const matrix = libredwg.dwg_ptr_to_double_array(transform_ptr, 12);
    const inverse_transform_ptr = libredwg.dwg_dynapi_entity_data(item, "inverse_transform");
    const invertBlockMatrix = libredwg.dwg_ptr_to_double_array(
      inverse_transform_ptr,
      12
    );
    return {
      ...commonAttrs,
      origin,
      numberOfPointsOnClipBoundary,
      vertices,
      extrusionDirection,
      clipBoundaryVisible: !!clipBoundaryVisible,
      frontClippingPlaneFlag: !!frontClippingPlaneFlag,
      frontClippingPlaneDistance,
      backClippingPlaneFlag: !!backClippingPlaneFlag,
      backClippingPlaneDistance,
      matrix,
      invertBlockMatrix
    };
  }
  convertXRecord(item, obj) {
    const libredwg = this.libredwg;
    const commonAttrs = this.getCommonObjectAttrs(obj);
    const cloning = libredwg.dwg_dynapi_entity_data(item, "cloning");
    const data = libredwg.dwg_object_xrecord_get_xdata(item) ?? [];
    const objectObj = libredwg.dwg_object_get_tio(obj);
    const xdic = objectObj ? libredwg.dwg_object_object_get_xdicobjhandle_object(objectObj) : null;
    const extensionDictionary = xdic && xdic.absolute_ref ? idToString(xdic.absolute_ref) : void 0;
    return {
      ...commonAttrs,
      ...cloning != null ? { cloning } : {},
      ...extensionDictionary ? { extensionDictionary } : {},
      data
    };
  }
  getCommonObjectAttrs(obj) {
    const libredwg = this.libredwg;
    const object_tio = libredwg.dwg_object_get_tio(obj);
    const ownerhandle = libredwg.dwg_object_object_get_ownerhandle_object(object_tio);
    const handle = libredwg.dwg_object_get_handle_object(obj);
    return {
      handle: idToString(handle.value),
      ownerHandle: idToString(ownerhandle.absolute_ref)
    };
  }
}
class Box2D {
  constructor() {
    __publicField(this, "min");
    __publicField(this, "max");
    __publicField(this, "valid");
    this.min = { x: Infinity, y: Infinity };
    this.max = { x: -Infinity, y: -Infinity };
    this.valid = false;
  }
  /**
   * Expands the bounding box to include a given point.
   *
   * @param point - The point to include in the bounding box.
   * @returns This bounding box after expansion.
   */
  expandByPoint(point) {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.valid = true;
    return this;
  }
  /**
   * Applies a scaling and translation transformation to this bounding box.
   *
   * @param scale - The scaling factors in x and y directions.
   * @param translation - The translation offsets in x and y directions.
   * @returns This bounding box after transformation.
   */
  transform(scale, translation) {
    const corners = this.getCorners().map((p) => ({
      x: p.x * scale.x + translation.x,
      y: p.y * scale.y + translation.y
    }));
    this.reset();
    for (const pt of corners) {
      this.expandByPoint(pt);
    }
    return this;
  }
  /**
   * Applies a rotation around a specific point to this bounding box.
   *
   * @param angleInRad - The angle of rotation in radians.
   * @param point - The center of rotation.
   * @returns This bounding box after rotation.
   */
  rotate(angleInRad, point) {
    const cos = Math.cos(angleInRad);
    const sin = Math.sin(angleInRad);
    const corners = this.getCorners().map((p) => {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      return {
        x: point.x + dx * cos - dy * sin,
        y: point.y + dx * sin + dy * cos
      };
    });
    this.reset();
    for (const pt of corners) {
      this.expandByPoint(pt);
    }
    return this;
  }
  /**
   * Creates a deep copy of this bounding box.
   *
   * @returns A new instance of Box2D with the same properties.
   */
  clone() {
    const box = new Box2D();
    box.min = { x: this.min.x, y: this.min.y };
    box.max = { x: this.max.x, y: this.max.y };
    box.valid = this.valid;
    return box;
  }
  /**
   * Resets this bounding box to its initial unbounded state.
   */
  reset() {
    this.min = { x: Infinity, y: Infinity };
    this.max = { x: -Infinity, y: -Infinity };
    this.valid = false;
  }
  /**
   * Retrieves the four corner points of the bounding box.
   *
   * @returns An array of corner points in the order:
   * bottom-left, top-left, bottom-right, top-right.
   */
  getCorners() {
    return [
      { x: this.min.x, y: this.min.y },
      { x: this.min.x, y: this.max.y },
      { x: this.max.x, y: this.min.y },
      { x: this.max.x, y: this.max.y }
    ];
  }
}
function evaluateBSpline(t, degree, points, knots, weights) {
  const n = points.length;
  if (n === 0) throw new Error("points must not be empty");
  const d = points[0].length;
  if (t < 0 || t > 1) {
    throw new Error(`t out of bounds [0,1]: ${t}`);
  }
  if (degree < 1) {
    throw new Error("degree must be at least 1 (linear)");
  }
  if (degree > n - 1) {
    throw new Error("degree must be less than or equal to point count - 1");
  }
  const weightsSafe = weights ?? new Array(n).fill(1);
  const knotsSafe = knots ?? (() => {
    const result2 = [];
    for (let i = 0; i < n + degree + 1; i++) {
      result2.push(i);
    }
    return result2;
  })();
  if (knotsSafe.length !== n + degree + 1) {
    throw new Error("bad knot vector length");
  }
  const domain = [degree, knotsSafe.length - 1 - degree];
  const low = knotsSafe[domain[0]];
  const high = knotsSafe[domain[1]];
  t = t * (high - low) + low;
  t = Math.max(t, low);
  t = Math.min(t, high);
  let s = domain[0];
  for (; s < domain[1]; s++) {
    if (t >= knotsSafe[s] && t <= knotsSafe[s + 1]) {
      break;
    }
  }
  const v = new Array(n);
  for (let i = 0; i < n; i++) {
    v[i] = new Array(d + 1);
    for (let j = 0; j < d; j++) {
      v[i][j] = points[i][j] * weightsSafe[i];
    }
    v[i][d] = weightsSafe[i];
  }
  for (let l = 1; l <= degree + 1; l++) {
    for (let i = s; i > s - degree - 1 + l; i--) {
      const denom = knotsSafe[i + degree + 1 - l] - knotsSafe[i];
      const alpha = denom === 0 ? 0 : (t - knotsSafe[i]) / denom;
      for (let j = 0; j < d + 1; j++) {
        v[i][j] = (1 - alpha) * v[i - 1][j] + alpha * v[i][j];
      }
    }
  }
  const result = new Array(d);
  for (let i = 0; i < d; i++) {
    result[i] = round10(v[s][i] / v[s][d], -9);
  }
  return result;
}
function round10(value, exp) {
  if (isNaN(value) || !Number.isInteger(exp)) {
    return NaN;
  }
  const [base, exponent = "0"] = value.toString().split("e");
  const shifted = Math.round(Number(`${base}e${+exponent - exp}`));
  const [shiftedBase, shiftedExp = "0"] = shifted.toString().split("e");
  return Number(`${shiftedBase}e${+shiftedExp + exp}`);
}
const _colorKeywords = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
const AUTO_CAD_COLOR_INDEX = [
  0,
  16711680,
  16776960,
  65280,
  65535,
  255,
  16711935,
  16777215,
  8421504,
  12632256,
  16711680,
  16744319,
  13369344,
  13395558,
  10027008,
  10046540,
  8323072,
  8339263,
  4980736,
  4990502,
  16727808,
  16752511,
  13382400,
  13401958,
  10036736,
  10051404,
  8331008,
  8343359,
  4985600,
  4992806,
  16744192,
  16760703,
  13395456,
  13408614,
  10046464,
  10056268,
  8339200,
  8347455,
  4990464,
  4995366,
  16760576,
  16768895,
  13408512,
  13415014,
  10056192,
  10061132,
  8347392,
  8351551,
  4995328,
  4997670,
  16776960,
  16777087,
  13421568,
  13421670,
  10000384,
  10000460,
  8355584,
  8355647,
  5000192,
  5000230,
  12582656,
  14679935,
  10079232,
  11717734,
  7510016,
  8755276,
  6258432,
  7307071,
  3755008,
  4344870,
  8388352,
  12582783,
  6736896,
  10079334,
  5019648,
  7510092,
  4161280,
  6258495,
  2509824,
  3755046,
  4194048,
  10485631,
  3394560,
  8375398,
  2529280,
  6264908,
  2064128,
  5209919,
  1264640,
  3099686,
  65280,
  8388479,
  52224,
  6736998,
  38912,
  5019724,
  32512,
  4161343,
  19456,
  2509862,
  65343,
  8388511,
  52275,
  6737023,
  38950,
  5019743,
  32543,
  4161359,
  19475,
  2509871,
  65407,
  8388543,
  52326,
  6737049,
  38988,
  5019762,
  32575,
  4161375,
  19494,
  2509881,
  65471,
  8388575,
  52377,
  6737074,
  39026,
  5019781,
  32607,
  4161391,
  19513,
  2509890,
  65535,
  8388607,
  52428,
  6737100,
  39064,
  5019800,
  32639,
  4161407,
  19532,
  2509900,
  49151,
  8380415,
  39372,
  6730444,
  29336,
  5014936,
  24447,
  4157311,
  14668,
  2507340,
  32767,
  8372223,
  26316,
  6724044,
  19608,
  5010072,
  16255,
  4153215,
  9804,
  2505036,
  16383,
  8364031,
  13260,
  6717388,
  9880,
  5005208,
  8063,
  4149119,
  4940,
  2502476,
  255,
  8355839,
  204,
  6710988,
  152,
  5000344,
  127,
  4145023,
  76,
  2500172,
  4129023,
  10452991,
  3342540,
  8349388,
  2490520,
  6245528,
  2031743,
  5193599,
  1245260,
  3089996,
  8323327,
  12550143,
  6684876,
  10053324,
  4980888,
  7490712,
  4128895,
  6242175,
  2490444,
  3745356,
  12517631,
  14647295,
  10027212,
  11691724,
  7471256,
  8735896,
  6226047,
  7290751,
  3735628,
  4335180,
  16711935,
  16744447,
  13369548,
  13395660,
  9961624,
  9981080,
  8323199,
  8339327,
  4980812,
  4990540,
  16711871,
  16744415,
  13369497,
  13395634,
  9961586,
  9981061,
  8323167,
  8339311,
  4980793,
  4990530,
  16711807,
  16744383,
  13369446,
  13395609,
  9961548,
  9981042,
  8323135,
  8339295,
  4980774,
  4990521,
  16711743,
  16744351,
  13369395,
  13395583,
  9961510,
  9981023,
  8323103,
  8339279,
  4980755,
  4990511,
  3355443,
  5987163,
  8684676,
  11382189,
  14079702,
  16777215,
  0
];
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
const _Color = class _Color {
  constructor() {
    __publicField(this, "_colorIndex");
    __publicField(this, "_color");
    __publicField(this, "_colorName");
    this._colorIndex = 256;
    this._color = null;
    this._colorName = null;
  }
  get color() {
    return this._color;
  }
  set color(value) {
    if (value == null) {
      this._color = null;
    } else {
      this._color = Math.round(clamp(value, 0, 256 * 256 * 256 - 1));
      this._colorIndex = this.getColorIndexByValue(this._color);
      this._colorName = this.getColorNameByValue(this._color);
    }
  }
  get hexColor() {
    if (this._color && this._color > 0 && this._color <= 16777215) {
      let hexString = this._color.toString(16).toUpperCase();
      while (hexString.length < 6) {
        hexString = "0" + hexString;
      }
      return `0x${hexString}`;
    }
    return "";
  }
  get cssColor() {
    return `rgb(${this.red},${this.green},${this.blue})`;
  }
  get red() {
    return this.color != null ? this.color >> 16 & 255 : null;
  }
  get green() {
    return this.color != null ? this.color >> 8 & 255 : null;
  }
  get blue() {
    return this.color != null ? this.color & 255 : null;
  }
  /**
   * AutoCAD color index value. The index value will be in the range 0 to 256. 0 and 256 are special values.
   * If value less than 0 is set, 0 will be used. If value greater than 256 is set, 256 will be used.
   * - 0 indicates that the entity uses the color of the BlockReference that's displaying it. If the entity
   * is not displayed through a block reference (for example, it is directly owned by the model space
   * block table record) and its color is 0, then it will display as though its color were 7.
   * - 256 indicates that the entity uses the color specified in the layer table record it references.
   */
  get colorIndex() {
    return this._colorIndex;
  }
  set colorIndex(value) {
    if (value == null) {
      this._colorIndex = null;
    } else {
      this._colorIndex = clamp(value, 0, 256);
      this._color = AUTO_CAD_COLOR_INDEX[value];
      this._colorName = this.getColorNameByValue(this._color);
    }
  }
  get colorName() {
    return this._colorName;
  }
  set colorName(value) {
    if (value) {
      const color = _colorKeywords[value.toLowerCase()];
      if (color !== void 0) {
        this._colorName = value;
        this._color = color;
        this._colorIndex = this.getColorIndexByValue(this._color);
      } else {
        console.warn("Unknown color: " + value);
      }
    } else {
      this._colorName = null;
    }
  }
  get hasColorName() {
    return this._colorName == null;
  }
  get hasColorIndex() {
    return this._colorIndex == null;
  }
  get isByLayer() {
    return this.colorIndex == 256;
  }
  setByLayer() {
    this.colorIndex = 256;
    return this;
  }
  get isByBlock() {
    return this.colorIndex == 0;
  }
  setByBlock() {
    this.colorIndex = 0;
    return this;
  }
  setScalar(scalar) {
    this.setRGB(scalar, scalar, scalar);
    return this;
  }
  setRGB(r, g, b) {
    const red = Math.round(clamp(r, 0, 255));
    const green = Math.round(clamp(g, 0, 255));
    const blue = Math.round(clamp(b, 0, 255));
    this.color = (red << 16) + (green << 8) + blue;
    return this;
  }
  setColorName(style) {
    const color = _colorKeywords[style.toLowerCase()];
    if (color !== void 0) {
      this.color = color;
    } else {
      console.warn("Unknown color " + style);
    }
    return this;
  }
  clone() {
    const clonedColor = new _Color();
    clonedColor.colorIndex = this.colorIndex;
    clonedColor.color = this.color;
    clonedColor._colorName = this._colorName;
    return this;
  }
  copy(color) {
    this.colorIndex = color.colorIndex;
    this.color = color.color;
    this._colorName = color._colorName;
    return this;
  }
  equals(c) {
    return c.color == this.color && c.colorIndex == this.colorIndex && c._colorName == this._colorName;
  }
  toString() {
    if (this.isByLayer) {
      return "ByLayer";
    } else if (this.isByBlock) {
      return "ByBlock";
    } else if (this.colorName) {
      return this.colorName;
    } else {
      return this.hexColor;
    }
  }
  getColorNameByValue(target) {
    for (const [key, value] of Object.entries(_colorKeywords)) {
      if (value === target) {
        return key;
      }
    }
    return null;
  }
  getColorIndexByValue(target) {
    const length = AUTO_CAD_COLOR_INDEX.length - 1;
    for (let index = 1; index < length; ++index) {
      if (AUTO_CAD_COLOR_INDEX[index] === target) {
        return index;
      }
    }
    return null;
  }
};
__publicField(_Color, "NAMES", _colorKeywords);
let Color = _Color;
class Vector2D {
  constructor(x, y) {
    __publicField(this, "x");
    __publicField(this, "y");
    this.x = x;
    this.y = y;
  }
  add(v) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }
  multiply(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }
  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  norm() {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / len, this.y / len);
  }
}
function createPolylineArcPoints(from, to, bulge, resolution = 5) {
  let theta;
  let a;
  let b;
  if (bulge < 0) {
    theta = Math.atan(-bulge) * 4;
    a = new Vector2D(from.x, from.y);
    b = new Vector2D(to.x, to.y);
  } else {
    theta = Math.atan(bulge) * 4;
    a = new Vector2D(to.x, to.y);
    b = new Vector2D(from.x, from.y);
  }
  const ab = b.sub(a);
  const lengthAB = ab.length();
  const c = a.add(ab.multiply(0.5));
  const lengthCD = Math.abs(lengthAB / 2 / Math.tan(theta / 2));
  const normAB = ab.norm();
  const rotated = new Vector2D(
    normAB.x * Math.cos(Math.PI / 2) - normAB.y * Math.sin(Math.PI / 2),
    normAB.y * Math.cos(Math.PI / 2) + normAB.x * Math.sin(Math.PI / 2)
  );
  const d = theta < Math.PI ? c.add(rotated.multiply(-lengthCD)) : c.add(rotated.multiply(lengthCD));
  const startAngle = Math.atan2(b.y - d.y, b.x - d.x) / Math.PI * 180;
  let endAngle = Math.atan2(a.y - d.y, a.x - d.x) / Math.PI * 180;
  if (endAngle < startAngle) {
    endAngle += 360;
  }
  const r = b.sub(d).length();
  const startInter = Math.floor(startAngle / resolution) * resolution + resolution;
  const endInter = Math.ceil(endAngle / resolution) * resolution - resolution;
  const points = [];
  for (let i = startInter; i <= endInter; i += resolution) {
    const angleRad = i / 180 * Math.PI;
    const point = d.add(
      new Vector2D(Math.cos(angleRad) * r, Math.sin(angleRad) * r)
    );
    points.push(point);
  }
  if (bulge < 0) {
    points.reverse();
  }
  return points;
}
function interpolatePolyline(entity, closed = false) {
  let points = [];
  const vertices = entity.vertices.map((v) => {
    return {
      x: v.x,
      y: v.y,
      bulge: v.bulge
    };
  });
  if (closed) {
    vertices.push(vertices[0]);
  }
  for (let i = 0, len = vertices.length; i < len - 1; ++i) {
    const from = vertices[i];
    const to = vertices[i + 1];
    points.push(from);
    if (vertices[i].bulge) {
      points = points.concat(
        createPolylineArcPoints(from, to, entity.vertices[i].bulge)
      );
    }
    if (i === len - 2) {
      points.push(to);
    }
  }
  return points;
}
class SvgConverter {
  constructor() {
    __publicField(this, "blockMap", /* @__PURE__ */ new Map());
  }
  rotate(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos
    };
  }
  /**
   * Interpolates a B-spline curve and returns the resulting polyline.
   *
   * @param controlPoints The control points of the B-spline.
   * @param degree The degree of the B-spline.
   * @param knots The knot vector.
   * @param interpolationsPerSplineSegment Number of interpolated points per spline segment.
   * @param weights Optional weight vector for rational B-splines.
   * @returns An array of interpolated 2D points representing the polyline.
   */
  interpolateBSpline(controlPoints, degree, knots, interpolationsPerSplineSegment = 25, weights) {
    const polyline = [];
    const controlPointsForLib = controlPoints.map(
      (p) => [p.x, p.y]
    );
    const segmentTs = [knots[degree]];
    const domain = [
      knots[degree],
      knots[knots.length - 1 - degree]
    ];
    for (let k = degree + 1; k < knots.length - degree; ++k) {
      if (segmentTs[segmentTs.length - 1] !== knots[k]) {
        segmentTs.push(knots[k]);
      }
    }
    for (let i = 1; i < segmentTs.length; ++i) {
      const uMin = segmentTs[i - 1];
      const uMax = segmentTs[i];
      for (let k = 0; k <= interpolationsPerSplineSegment; ++k) {
        const u = k / interpolationsPerSplineSegment * (uMax - uMin) + uMin;
        let t = (u - domain[0]) / (domain[1] - domain[0]);
        t = Math.max(0, Math.min(1, t));
        const p = evaluateBSpline(
          t,
          degree,
          controlPointsForLib,
          knots,
          weights
        );
        polyline.push({ x: p[0], y: p[1] });
      }
    }
    return polyline;
  }
  addFlipXIfApplicable(entity, { bbox, element }) {
    if ("extrusionDirection" in entity && entity.extrusionDirection.z === -1) {
      return {
        bbox: new Box2D().expandByPoint({ x: -bbox.min.x, y: bbox.min.y }).expandByPoint({ x: -bbox.max.x, y: bbox.max.y }),
        element: `<g transform="matrix(-1 0 0 1 0 0)">${element}</g>`
      };
    } else {
      return { bbox, element };
    }
  }
  line(entity) {
    const bbox = new Box2D().expandByPoint({ x: entity.startPoint.x, y: entity.startPoint.y }).expandByPoint({ x: entity.endPoint.x, y: entity.endPoint.y });
    const element = `<line x1="${entity.startPoint.x}" y1="${entity.startPoint.y}" x2="${entity.endPoint.x}" y2="${entity.endPoint.y}" />`;
    return { bbox, element };
  }
  ray(entity) {
    const scale = 1e4;
    const firstPoint = entity.firstPoint;
    const secondPoint = {
      x: firstPoint.x + entity.unitDirection.x * scale,
      y: firstPoint.y + entity.unitDirection.y * scale
    };
    const bbox = new Box2D().expandByPoint(firstPoint).expandByPoint(secondPoint);
    const element = `<line x1="${firstPoint.x}" y1="${firstPoint.y}" x2="${secondPoint.x}" y2="${secondPoint.y}" />`;
    return { bbox, element };
  }
  xline(entity) {
    const scale = 1e4;
    const firstPoint = {
      x: entity.firstPoint.x - entity.unitDirection.x * scale,
      y: entity.firstPoint.y - entity.unitDirection.y * scale
    };
    const secondPoint = {
      x: entity.firstPoint.x + entity.unitDirection.x * scale,
      y: entity.firstPoint.y + entity.unitDirection.y * scale
    };
    const bbox = new Box2D().expandByPoint(firstPoint).expandByPoint(secondPoint);
    const element = `<line x1="${firstPoint.x}" y1="${firstPoint.y}" x2="${secondPoint.x}" y2="${secondPoint.y}" />`;
    return { bbox, element };
  }
  extractMTextLines(mtext) {
    return mtext.replace(
      /\\U\+([0-9A-Fa-f]{4})/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))
    ).replace(/\\P/g, "\n").replace(/\\[LOlo]/g, "").replace(/\\[Ff][^;\\]*?(?:\|[^;\\]*)*;/g, "").replace(/\\[KkCcHhWwTtAa][^;\\]*;?/g, "").replace(/\\[a-zA-Z]+;?/g, "").replace(/%%(d|p|c|%)/gi, "").replace(/\\\\/g, "\\").replace(/\\~/g, " ").replace(/[{}]/g, "").split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  }
  lines(lines, fontsize, insertionPoint, extentsWidth, anchor = "start") {
    const bbox = new Box2D().expandByPoint({
      x: insertionPoint.x,
      y: insertionPoint.y
    }).expandByPoint({
      x: insertionPoint.x + extentsWidth,
      y: insertionPoint.y - lines.length * fontsize * 1.5
    });
    const texts = lines.map((line, index) => {
      const x = insertionPoint.x;
      const y = insertionPoint.y - index * fontsize * 1.5;
      const transform = `translate(${x},${y}) scale(1,-1) translate(${-x},${-y})`;
      return `<text x="${x}" y="${y}" font-size="${fontsize}" text-anchor="${anchor}" transform="${transform}">${line}</text>`;
    });
    return { bbox, element: texts.join("\n") };
  }
  mtext(entity) {
    const fontsize = entity.textHeight;
    const insertionPoint = entity.insertionPoint;
    const lines = this.extractMTextLines(entity.text);
    const attachmentPoint = entity.attachmentPoint;
    let anchor = "start";
    if (attachmentPoint == DwgAttachmentPoint.BottomCenter || attachmentPoint == DwgAttachmentPoint.MiddleCenter || attachmentPoint == DwgAttachmentPoint.TopCenter) {
      anchor = "middle";
    } else if (attachmentPoint == DwgAttachmentPoint.BottomRight || attachmentPoint == DwgAttachmentPoint.MiddleRight || attachmentPoint == DwgAttachmentPoint.TopRight) {
      anchor = "end";
    }
    return this.lines(
      lines,
      fontsize,
      insertionPoint,
      entity.extentsWidth,
      anchor
    );
  }
  table(entity) {
    const {
      rowCount,
      columnCount,
      rowHeightArr,
      columnWidthArr,
      startPoint,
      cells
    } = entity;
    const originX = startPoint.x;
    const originY = startPoint.y;
    const cellRects = [];
    for (let row = 0, y = originY; row < rowCount; row++) {
      const height = rowHeightArr[row];
      let x = originX;
      for (let col = 0; col < columnCount; col++) {
        const cellIndex = row * columnCount + col;
        const cell = cells[cellIndex];
        const width = columnWidthArr[col];
        cellRects.push({ x, y, width, height, cell, row, col });
        x += width;
      }
      y += height;
    }
    const svgElements = cellRects.map(({ x, y, width, height, cell }) => {
      const lines = [];
      if (cell.topBorderVisibility)
        lines.push(
          `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="black" />`
        );
      if (cell.bottomBorderVisibility)
        lines.push(
          `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="black" />`
        );
      if (cell.leftBorderVisibility)
        lines.push(
          `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" stroke="black" />`
        );
      if (cell.rightBorderVisibility)
        lines.push(
          `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="black" />`
        );
      const textX = x + width / 2;
      const textY = y + height / 2 + cell.textHeight / 3;
      const text = `<text x="${textX}" y="${textY}" font-size="${cell.textHeight}" text-anchor="middle" dominant-baseline="middle">${cell.text}</text>`;
      return [...lines, text].join("\n");
    }).join("\n");
    const totalWidth = columnWidthArr.reduce((sum, w) => sum + w, 0);
    const totalHeight = rowHeightArr.reduce((sum, h) => sum + h, 0);
    const bbox = new Box2D().expandByPoint({ x: originX, y: originY }).expandByPoint({ x: originX + totalWidth, y: originY + totalHeight });
    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="${originX} ${originY} ${totalWidth} ${totalHeight}">
  ${svgElements}
  </svg>
    `.trim();
    return {
      bbox,
      element: svg
    };
  }
  text(entity) {
    const fontsize = entity.textHeight;
    const insertionPoint = entity.startPoint;
    const lines = [entity.text];
    let extentsWidth = entity.endPoint.x - entity.endPoint.x;
    if (entity.halign == 0) {
      extentsWidth = entity.text.length * fontsize + entity.startPoint.x;
    }
    let anchor = "start";
    if (entity.halign == DwgTextHorizontalAlign.CENTER) {
      anchor = "middle";
    } else if (entity.halign == DwgTextHorizontalAlign.RIGHT) {
      anchor = "end";
    }
    return this.lines(lines, fontsize, insertionPoint, extentsWidth, anchor);
  }
  vertices(vertices, closed = false) {
    const bbox = vertices.reduce(
      (acc, point) => acc.expandByPoint(point),
      new Box2D()
    );
    let d = vertices.reduce((acc, point, i) => {
      acc += i === 0 ? "M" : "L";
      acc += point.x + "," + point.y;
      return acc;
    }, "");
    if (closed) {
      d += "Z";
    }
    return { bbox, element: `<path d="${d}" />` };
  }
  circle(entity) {
    const bbox0 = new Box2D().expandByPoint({
      x: entity.center.x + entity.radius,
      y: entity.center.y + entity.radius
    }).expandByPoint({
      x: entity.center.x - entity.radius,
      y: entity.center.y - entity.radius
    });
    const element0 = `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" />`;
    return {
      bbox: bbox0,
      element: element0
    };
  }
  ellipseOrArc(cx, cy, majorX, majorY, axisRatio, startAngle, endAngle) {
    const rx = Math.sqrt(majorX * majorX + majorY * majorY);
    const ry = axisRatio * rx;
    const rotationAngle = -Math.atan2(-majorY, majorX);
    const bbox = this.bboxEllipseOrArc(
      cx,
      cy,
      majorX,
      majorY,
      axisRatio,
      startAngle,
      endAngle
    );
    if (Math.abs(startAngle - endAngle) < 1e-9 || Math.abs(startAngle - endAngle + Math.PI * 2) < 1e-9) {
      const element = `<g transform="rotate(${rotationAngle / Math.PI * 180} ${cx}, ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" /></g>`;
      return { bbox, element };
    } else {
      const startOffset = this.rotate(
        { x: Math.cos(startAngle) * rx, y: Math.sin(startAngle) * ry },
        rotationAngle
      );
      const startPoint = { x: cx + startOffset.x, y: cy + startOffset.y };
      const endOffset = this.rotate(
        { x: Math.cos(endAngle) * rx, y: Math.sin(endAngle) * ry },
        rotationAngle
      );
      const endPoint = { x: cx + endOffset.x, y: cy + endOffset.y };
      const adjustedEndAngle = endAngle < startAngle ? endAngle + Math.PI * 2 : endAngle;
      const largeArcFlag = adjustedEndAngle - startAngle < Math.PI ? 0 : 1;
      const d = `M ${startPoint.x} ${startPoint.y} A ${rx} ${ry} ${rotationAngle / Math.PI * 180} ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
      const element = `<path d="${d}" />`;
      return { bbox, element };
    }
  }
  bboxEllipseOrArc(cx, cy, majorX, majorY, axisRatio, startAngle, endAngle) {
    while (startAngle < 0) startAngle += Math.PI * 2;
    while (endAngle <= startAngle) endAngle += Math.PI * 2;
    const angles = [];
    if (Math.abs(majorX) < 1e-12 || Math.abs(majorY) < 1e-12) {
      for (let i = 0; i < 4; i++) {
        angles.push(i / 2 * Math.PI);
      }
    } else {
      angles[0] = Math.atan(-majorY * axisRatio / majorX) - Math.PI;
      angles[1] = Math.atan(majorX * axisRatio / majorY) - Math.PI;
      angles[2] = angles[0] - Math.PI;
      angles[3] = angles[1] - Math.PI;
    }
    for (let i = 4; i >= 0; i--) {
      while (angles[i] < startAngle) angles[i] += Math.PI * 2;
      if (angles[i] > endAngle) {
        angles.splice(i, 1);
      }
    }
    angles.push(startAngle);
    angles.push(endAngle);
    const pts = angles.map((a) => ({ x: Math.cos(a), y: Math.sin(a) }));
    const M = [
      [majorX, -majorY * axisRatio],
      [majorY, majorX * axisRatio]
    ];
    const rotatedPts = pts.map((p) => ({
      x: p.x * M[0][0] + p.y * M[0][1] + cx,
      y: p.x * M[1][0] + p.y * M[1][1] + cy
    }));
    const bbox = rotatedPts.reduce(
      (acc, p) => {
        acc.expandByPoint(p);
        return acc;
      },
      new Box2D()
    );
    return bbox;
  }
  ellipse(entity) {
    const { bbox: bbox0, element: element0 } = this.ellipseOrArc(
      entity.center.x,
      entity.center.y,
      entity.majorAxisEndPoint.x,
      entity.majorAxisEndPoint.y,
      entity.axisRatio,
      entity.startAngle,
      entity.endAngle
    );
    return {
      bbox: bbox0,
      element: element0
    };
  }
  arc(entity) {
    const { bbox: bbox0, element: element0 } = this.ellipseOrArc(
      entity.center.x,
      entity.center.y,
      entity.radius,
      0,
      1,
      entity.startAngle,
      entity.endAngle
    );
    return {
      bbox: bbox0,
      element: element0
    };
  }
  dimension(entity) {
    const block = this.blockMap.get(entity.name);
    if (block) {
      return {
        bbox: block.bbox,
        element: `<use href="#${entity.name}" />`
      };
    }
    return null;
  }
  insert(entity) {
    const block = this.blockMap.get(entity.name);
    if (block) {
      const insertionPoint = entity.insertionPoint;
      const rotation = entity.rotation * (180 / Math.PI);
      const transform = `translate(${insertionPoint.x},${insertionPoint.y}) rotate(${rotation}) scale(${entity.xScale},${entity.yScale})`;
      const newBBox = block.bbox.clone().transform(
        { x: entity.xScale, y: entity.yScale },
        { x: insertionPoint.x, y: insertionPoint.y }
      ).rotate(entity.rotation, insertionPoint);
      return {
        bbox: newBBox,
        element: `<use href="#${entity.name}" transform="${transform}" />`
      };
    }
    return null;
  }
  block(block, dwg) {
    const entities = block.entities;
    const { bbox, elements } = entities.reduce(
      (acc, entity) => {
        const boundsAndElement = this.entityToBoundsAndElement(entity);
        if (boundsAndElement) {
          const { bbox: bbox2, element } = boundsAndElement;
          if (bbox2.valid) {
            acc.bbox.expandByPoint(bbox2.min);
            acc.bbox.expandByPoint(bbox2.max);
          }
          const color = this.getEntityColor(dwg.tables.LAYER.entries, entity);
          const fill = entity.type == "TEXT" || entity.type == "MTEXT" ? color.cssColor : "none";
          if (color.isByBlock) {
            acc.elements.push(`<g id="${entity.handle}">${element}</g>`);
          } else {
            acc.elements.push(
              `<g id="${entity.handle}" stroke="${color.cssColor}" fill="${fill}">${element}</g>`
            );
          }
        }
        return acc;
      },
      {
        bbox: new Box2D(),
        elements: []
      }
    );
    if (bbox.valid) {
      return {
        bbox,
        element: `<g id="${block.name}">${elements.join("\n")}</g>`
      };
    }
    return null;
  }
  entityToBoundsAndElement(entity) {
    let result = null;
    switch (entity.type) {
      case "ARC":
        result = this.arc(entity);
        break;
      case "CIRCLE":
        result = this.circle(entity);
        break;
      case "DIMENSION":
        result = this.dimension(entity);
        break;
      case "ELLIPSE":
        result = this.ellipse(entity);
        break;
      case "INSERT":
        result = this.insert(entity);
        break;
      case "LINE":
        result = this.line(entity);
        break;
      case "LWPOLYLINE": {
        const lwpolyline = entity;
        const closed = !!(lwpolyline.flag & 512);
        const vertices = interpolatePolyline(lwpolyline, closed);
        result = this.vertices(vertices, closed);
        break;
      }
      case "MTEXT":
        result = this.mtext(entity);
        break;
      case "SPLINE": {
        const spline = entity;
        result = this.vertices(
          this.interpolateBSpline(
            spline.controlPoints,
            spline.degree,
            spline.knots,
            25,
            spline.weights
          )
        );
        break;
      }
      case "POLYLINE": {
        break;
      }
      case "RAY":
        result = this.ray(entity);
        break;
      case "TABLE":
      case "ACAD_TABLE":
        result = this.table(entity);
        break;
      case "TEXT":
        result = this.text(entity);
        break;
      case "XLINE":
        result = this.xline(entity);
        break;
      default:
        result = null;
        break;
    }
    if (result) {
      return this.addFlipXIfApplicable(entity, result);
    }
    return null;
  }
  getEntityColor(layers, entity) {
    const color = new Color();
    if (entity.colorIndex != null) {
      color.colorIndex = entity.colorIndex;
    } else if (entity.colorName) {
      color.colorName = entity.colorName;
    } else if (entity.color != null) {
      color.color = entity.color;
    }
    if (color.colorIndex == 7) {
      color.colorIndex = 256;
    }
    if (color.isByLayer) {
      const layer = layers.find(
        (layer2) => layer2.name === entity.layer
      );
      if (layer != null) {
        color.colorIndex = layer.colorIndex;
      }
    }
    if (color.color == null) {
      color.color = 16777215;
    }
    return color;
  }
  convert(dwg) {
    let modelSpace = null;
    this.blockMap.clear();
    let blockElements = "";
    dwg.tables.BLOCK_RECORD.entries.forEach((block) => {
      if (isModelSpace(block.name)) {
        modelSpace = block;
      } else {
        const item = this.block(block, dwg);
        if (item) {
          blockElements += item.element;
          this.blockMap.set(block.name, item);
        }
      }
    });
    const ms = this.block(modelSpace, dwg);
    const viewBox = ms && ms.bbox.valid ? {
      x: ms.bbox.min.x,
      y: -ms.bbox.max.y,
      width: ms.bbox.max.x - ms.bbox.min.x,
      height: ms.bbox.max.y - ms.bbox.min.y
    } : {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    return `<?xml version="1.0"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
  preserveAspectRatio="xMinYMin meet"
  viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"
  width="100%" height="100%"
>
  <defs>${blockElements}</defs>
  <g stroke="#000000" stroke-width="0.1%" fill="none" transform="matrix(1,0,0,-1,0,0)">
    ${ms ? ms.element : ""}
  </g>
</svg>`;
  }
}
var DwgThumbnailImageType = /* @__PURE__ */ ((DwgThumbnailImageType2) => {
  DwgThumbnailImageType2[DwgThumbnailImageType2["BMP"] = 2] = "BMP";
  DwgThumbnailImageType2[DwgThumbnailImageType2["WMF"] = 3] = "WMF";
  DwgThumbnailImageType2[DwgThumbnailImageType2["PNG"] = 6] = "PNG";
  return DwgThumbnailImageType2;
})(DwgThumbnailImageType || {});
const _LibreDwg = class _LibreDwg {
  constructor(wasmInstance) {
    __publicField(this, "wasmInstance");
    __publicField(this, "decoder");
    this.wasmInstance = wasmInstance;
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return Reflect.get(target.wasmInstance, prop, receiver);
      }
    });
  }
  dwg_read_data(fileContent, fileType) {
    if (fileType == Dwg_File_Type.DWG) {
      const fileName = "tmp.dwg";
      try {
        this.wasmInstance.FS.writeFile(
          fileName,
          new Uint8Array(fileContent)
        );
        const result = this.wasmInstance.dwg_read_file(fileName);
        if (result.error & Dwg_Error.OUTOFMEM) {
          this.wasmInstance.dwg_abandon(result.data);
          throw new Error(
            "Failed to decode DWG: out of WASM memory. Rebuild with pnpm build:wasm (INITIAL_MEMORY=1GB) or use a smaller file."
          );
        }
        if (result.error != 0) {
          console.warn("Open dwg file with error code:", result.error);
        }
        return result.data;
      } finally {
        if (this.wasmInstance.FS.analyzePath(fileName, false).exists) {
          this.wasmInstance.FS.unlink(fileName);
        }
      }
    }
  }
  /**
   * Converts DWG file content to DXF file content.
   * @param fileContent DWG file content.
   * @returns Returns DXF file content if conversion succeeds. Otherwise returns null.
   */
  dwg_write_dxf(fileContent) {
    const inputFileName = "tmp.dwg";
    const outputFileName = "tmp.dxf";
    try {
      this.wasmInstance.FS.writeFile(
        inputFileName,
        new Uint8Array(fileContent)
      );
      const error = this.wasmInstance.dwg_write_dxf(
        inputFileName,
        outputFileName
      );
      if (error != 0) {
        console.log("Convert dwg to dxf with error code: ", error);
        return null;
      }
      return this.wasmInstance.FS.readFile(outputFileName);
    } finally {
      if (this.wasmInstance.FS.analyzePath(inputFileName, false).exists) {
        this.wasmInstance.FS.unlink(inputFileName);
      }
      if (this.wasmInstance.FS.analyzePath(outputFileName, false).exists) {
        this.wasmInstance.FS.unlink(outputFileName);
      }
    }
  }
  /**
   * Gets the version of the dwg.
   * @param data Pointer to Dwg_Data instance.
   * @returns Return the version of the dwg
   */
  dwg_get_version_type(data) {
    const version = this.wasmInstance.dwg_get_version_type(data);
    return dwgVersions[version];
  }
  /**
   * Gets code page of the dwg.
   * @param data Pointer to Dwg_Data instance.
   * @returns Return code page of the dwg
   */
  dwg_get_codepage(data) {
    const codepage = this.wasmInstance.dwg_get_codepage(data);
    return codepage;
  }
  /**
   * Extracts thumbnail image from dwg.
   * @param data Pointer to Dwg_Data instance.
   * @returns Return thumbnail image data
   */
  dwg_bmp(data) {
    return this.wasmInstance.dwg_bmp(data);
  }
  /**
   * Returns the number of classes in dwg file.
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns the number of classes in dwg file.
   */
  dwg_get_num_classes(data) {
    return this.wasmInstance.dwg_get_num_classes(data);
  }
  /**
   * Returns the nth class in dwg file.
   * @param data Pointer to Dwg_Data instance.
   * @param index Index of the class
   * @returns Returns the nth class in dwg file.
   */
  dwg_get_class(data, index) {
    return this.wasmInstance.dwg_get_class(data, index);
  }
  /**
   * Converts Dwg_Data instance to DwgDatabase instance. DwgDatabase instance doesn't depend on
   * Dwg_Data instance any more after conversion. So you can call function dwg_free to free memory
   * occupied by Dwg_Data.
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns the converted DwgDatabase.
   */
  convert(data) {
    const codepage = this.dwg_get_codepage(data);
    const encoding = dwgCodePageToEncoding(codepage);
    this.decoder = new TextDecoder(encoding);
    const converter = new LibreDwgConverter(this);
    return converter.convert(data);
  }
  /**
   * Converts Dwg_Data instance to DwgDatabase instance and returns conversion statistics.
   * DwgDatabase instance doesn't depend on Dwg_Data instance any more after conversion.
   * So you can call function dwg_free to free memory occupied by Dwg_Data.
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns the converted DwgDatabase and conversion statistics.
   */
  convertEx(data) {
    const codepage = this.dwg_get_codepage(data);
    const encoding = dwgCodePageToEncoding(codepage);
    this.decoder = new TextDecoder(encoding);
    const converter = new LibreDwgConverter(this);
    return {
      database: converter.convert(data),
      stats: converter.getConversionStats()
    };
  }
  /**
   * Converts DwgDatabase instance to svg string.
   * @param data DwgDatabase instance.
   * @returns Returns the converted svg string.
   */
  dwg_to_svg(data) {
    const converter = new SvgConverter();
    return converter.convert(data);
  }
  /**
   * Frees the whole DWG. all tables, sections, objects, ...
   * @param data Pointer to Dwg_Data instance.
   */
  dwg_free(data) {
    if (!data) {
      return;
    }
    try {
      this.wasmInstance.dwg_free(data);
    } catch {
      try {
        this.wasmInstance.dwg_abandon(data);
      } catch {
      }
    }
  }
  /**
   * Frees the object (all three structs and its fields)
   * @group Dwg_Object Methods
   * @param ptr Pointer to one Dwg_Object instance.
   */
  dwg_free_object(obj_ptr) {
    this.wasmInstance.dwg_free_object(obj_ptr);
  }
  /**
   * Gets an object by its handle.
   * @group Handle Conversion Methods
   * @param data Pointer to Dwg_Data instance.
   * @param ref_ptr Pointer to Dwg_Object_Ref instance.
   * @returns Returns the object whose handle is equal to the given handle.
   */
  dwg_ref_object(data, ref_ptr) {
    return this.wasmInstance.dwg_ref_object(data, ref_ptr);
  }
  /**
   * Gets an object by its handle without warning message.
   * @group Handle Conversion Methods
   * @param data Pointer to Dwg_Data instance.
   * @param ref_ptr Pointer to Dwg_Object_Ref instance.
   * @returns Returns the object whose handle is equal to the given handle.
   */
  dwg_ref_object_silent(data, ref_ptr) {
    return this.wasmInstance.dwg_ref_object_silent(data, ref_ptr);
  }
  /**
   * Gets an object given its handle and relative base object.
   * @group Handle Conversion Methods
   * @param data Pointer to Dwg_Data instance.
   * @param ref_ptr Pointer to Dwg_Object_Ref instance.
   * @param obj_ptr Pointer to the relative base object (Dwg_Object instance).
   * @returns Returns the object given its handle and relative base object.
   */
  dwg_ref_object_relative(data, ref_ptr, obj_ptr) {
    return this.wasmInstance.dwg_ref_object_relative(data, ref_ptr, obj_ptr);
  }
  /**
   * Resolves handle absref value to Dwg_Object instance.
   * @group Handle Conversion Methods
   * @param data Pointer to Dwg_Data instance.
   * @param absref Handle absref value.
   * @returns Returns the object with the given handle absref value.
   */
  dwg_resolve_handle(data, absref) {
    return this.wasmInstance.dwg_resolve_handle(data, absref);
  }
  /**
   * Resolves handle absref value to Dwg_Object instance without warning message.
   * @group Handle Conversion Methods
   * @param data Pointer to Dwg_Data instance.
   * @param absref Handle absref value.
   * @returns Returns the object with the given handle absref value.
   */
  dwg_resolve_handle_silent(data, absref) {
    return this.wasmInstance.dwg_resolve_handle_silent(data, absref);
  }
  /**
   * Sets ref->absolute_ref from the specified obj for a subsequent dwg_resolve_handle
   * @group Handle Conversion Methods
   * @param ref_ptr Pointer to Dwg_Object_Ref instance.
   * @param obj_ptr Pointer to Dwg_Object instance.
   * @returns Returns 1 if set absref value correctly. Otherwise, return 0.
   */
  dwg_resolve_handleref(ref_ptr, obj_ptr) {
    return this.wasmInstance.dwg_resolve_handleref(ref_ptr, obj_ptr);
  }
  /**
   * Returns the absolute handle reference of one Dwg_Object_Ref instance.
   * @group Handle Conversion Methods
   * @returns Returns null when the reference or absolute_ref is absent.
   */
  dwg_ref_get_absref(ref_ptr) {
    if (!ref_ptr) return null;
    const absref = this.wasmInstance.dwg_ref_get_absref(ref_ptr);
    return absref === 0 ? null : absref;
  }
  /**
   * Returns the handle value of one Dwg_Object_Ref instance.
   * @group Handle Conversion Methods
   * @returns Returns null when the reference or handle value is absent.
   */
  dwg_ref_get_handle_value(ref_ptr) {
    if (!ref_ptr) return null;
    const value = this.wasmInstance.dwg_ref_get_handle_value(ref_ptr);
    return value === 0n ? null : value;
  }
  /**
   * Returns the absolute_ref of one Dwg_Object_Ref instance as bigint.
   * @group Handle Conversion Methods
   * @returns Returns null when the reference or absolute_ref is absent.
   */
  dwg_ref_get_handle_absolute_ref(ref_ptr) {
    if (!ref_ptr) return null;
    const value = this.wasmInstance.dwg_ref_get_handle_absolute_ref(ref_ptr);
    return value === 0n ? null : value;
  }
  /**
   * Returns the handle value of one Dwg_Object instance.
   * @group Handle Conversion Methods
   * @returns Returns null when the object or handle value is absent.
   */
  dwg_obj_get_handle_value(obj_ptr) {
    if (!obj_ptr) return null;
    const value = this.wasmInstance.dwg_obj_get_handle_value(obj_ptr);
    return value === 0n ? null : value;
  }
  /**
   * Returns the absolute_ref of one Dwg_Object_Ref as uppercase hex handle id.
   * @group Handle Conversion Methods
   */
  dwg_ref_get_id(ref_ptr) {
    const absref = this.dwg_ref_get_absref(ref_ptr);
    return absref == null ? void 0 : absref.toString(16).toUpperCase();
  }
  /**
   * Returns object (such as line type, layer name, dimension style, and etc.) name by its handle.
   * @group Handle Conversion Methods
   * @param ref_ptr Pointer to Dwg_Object_Ref instance.
   * @returns Returns object name by its handle.
   */
  dwg_ref_get_object_name(ref_ptr) {
    const wasmInstance = this.wasmInstance;
    const obj = wasmInstance.dwg_ref_get_object(ref_ptr);
    const obj_tio = wasmInstance.dwg_object_to_object_tio(obj);
    const obj_name = this.dwg_dynapi_entity_data(obj_tio, "name");
    return obj_name;
  }
  /**
   * Converts Dwg_Object_Object instance to Dwg_Object instance.
   * @group Object Conversion Methods
   * @param obj_ptr Pointer to Dwg_Object_Object instance.
   * @returns Returns one pointer to Dwg_Object instance.
   */
  dwg_obj_obj_to_object(obj_obj_ptr) {
    return this.wasmInstance.dwg_obj_obj_to_object(obj_obj_ptr);
  }
  /**
   * Converts Dwg_Object_* instance to Dwg_Object instance.
   * @group Object Conversion Methods
   * @param obj_generic_ptr Pointer to Dwg_Object_* instance.
   * @returns Returns one pointer to Dwg_Object instance.
   */
  dwg_obj_generic_to_object(obj_generic_ptr) {
    return this.wasmInstance.dwg_obj_generic_to_object(obj_generic_ptr);
  }
  /**
   * Converts Dwg_Object instance to Dwg_Object_Object instance.
   * @group Object Conversion Methods
   * @param obj_ptr Pointer to Dwg_Object instance.
   * @returns Returns one pointer to Dwg_Object_Object instance.
   */
  dwg_object_to_object(obj_ptr) {
    return this.wasmInstance.dwg_object_to_object(obj_ptr);
  }
  /**
   * Gets Dwg_Object_* instance (such as Dwg_Entity_LAYER, Dwg_Entity_STYLE, and etc.)
   * from Dwg_Object instance.
   * @group Object Conversion Methods
   * @param obj_ptr Pointer to Dwg_Object instance.
   * @returns Returns one pointer to Dwg_Object_Object_TIO_Ptr instance.
   */
  dwg_object_to_object_tio(obj_ptr) {
    return this.wasmInstance.dwg_object_to_object_tio(obj_ptr);
  }
  /**
   * Converts Dwg_Object instance to Dwg_Object_Entity instance.
   * @group Object Conversion Methods
   * @param obj_ptr Pointer to Dwg_Object instance.
   * @returns Returns one pointer to Dwg_Object_Entity instance.
   */
  dwg_object_to_entity(obj_ptr) {
    return this.wasmInstance.dwg_object_to_entity(obj_ptr);
  }
  /**
   * Gets Dwg_Entity_* instance (such as Dwg_Entity_LINE, Dwg_Entity_SPLINE, and etc.)
   * from Dwg_Object instance.
   * @group Object Conversion Methods
   * @param obj_ptr Pointer to Dwg_Object instance.
   * @returns Returns one pointer to Dwg_Object_Object_TIO_Ptr instance.
   */
  dwg_object_to_entity_tio(obj_ptr) {
    return this.wasmInstance.dwg_object_to_entity_tio(obj_ptr);
  }
  /**
   * Returns all of entities in the model space. Each item in returned array
   * is one Dwg_Object pointer (Dwg_Object*).
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of entities in the model space.
   */
  dwg_getall_entities_in_model_space(data) {
    const wasmInstance = this.wasmInstance;
    const model_space = wasmInstance.dwg_model_space_object(data);
    const entities = [];
    let next = wasmInstance.get_first_owned_entity(model_space);
    while (next) {
      entities.push(next);
      next = wasmInstance.get_next_owned_entity(model_space, next);
    }
    return entities;
  }
  /**
   * Returns all of objects in Dwg_Data instance with the specified type.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @param type Object type.
   * @returns Returns all of objects with the specified type.
   */
  dwg_getall_object_by_type(data, type) {
    const wasmInstance = this.wasmInstance;
    const num_objects = wasmInstance.dwg_get_num_objects(data);
    const results = [];
    for (let i = 0; i < num_objects; i++) {
      const obj = wasmInstance.dwg_get_object(data, i);
      const tio = wasmInstance.dwg_object_to_object_tio(obj);
      if (tio && wasmInstance.dwg_object_get_fixedtype(obj) == type) {
        results.push(tio);
      }
    }
    return results;
  }
  /**
   * Returns all of objects in Dwg_Data instance with the specified type.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @param type Object type.
   * @returns Returns all of objects with the specified type.
   */
  dwg_getall_entity_by_type(data, type) {
    const wasmInstance = this.wasmInstance;
    const num_objects = wasmInstance.dwg_get_num_objects(data);
    const results = [];
    for (let i = 0; i < num_objects; i++) {
      const obj = wasmInstance.dwg_get_object(data, i);
      const tio = wasmInstance.dwg_object_to_entity_tio(obj);
      if (tio && wasmInstance.dwg_object_get_fixedtype(obj) == type) {
        results.push(tio);
      }
    }
    return results;
  }
  /**
   * Returns all of layer objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of layer objects in Dwg_Data instance.
   */
  dwg_getall_LAYER(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_LAYER);
  }
  /**
   * Returns all of line type objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of line type objects in Dwg_Data instance.
   */
  dwg_getall_LTYPE(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_LTYPE);
  }
  /**
   * Returns all of text style objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of text style objects in Dwg_Data instance.
   */
  dwg_getall_STYLE(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_STYLE);
  }
  /**
   * Returns all of dimension style objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of dimension style objects in Dwg_Data instance.
   */
  dwg_getall_DIMSTYLE(data) {
    return this.dwg_getall_object_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_DIMSTYLE
    );
  }
  /**
   * Returns all of viewport objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of viewport objects in Dwg_Data instance.
   */
  dwg_getall_VPORT(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_VPORT);
  }
  /**
   * Returns all of layout objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of layout objects in Dwg_Data instance.
   */
  dwg_getall_LAYOUT(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_LAYOUT);
  }
  /**
   * Returns all of block objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of block objects in Dwg_Data instance.
   */
  dwg_getall_BLOCK(data) {
    return this.dwg_getall_object_by_type(data, Dwg_Object_Type.DWG_TYPE_BLOCK);
  }
  /**
   * Returns all of block header objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of block header objects in Dwg_Data instance.
   */
  dwg_getall_BLOCK_HEADER(data) {
    return this.dwg_getall_object_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_BLOCK_HEADER
    );
  }
  /**
   * Returns all of image definition objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of image definition objects in Dwg_Data instance.
   */
  dwg_getall_IMAGEDEF(data) {
    return this.dwg_getall_object_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_IMAGEDEF
    );
  }
  /**
   * Returns all of 2d vertex objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of 2d vertex objects in Dwg_Data instance.
   */
  dwg_getall_VERTEX_2D(data) {
    return this.dwg_getall_entity_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_VERTEX_2D
    );
  }
  /**
   * Returns all of 3d vertex objects in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of 3d vertex objects in Dwg_Data instance.
   */
  dwg_getall_VERTEX_3D(data) {
    return this.dwg_getall_entity_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_VERTEX_3D
    );
  }
  /**
   * Returns all of 2d polyline entities in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of 2d polyline entities in Dwg_Data instance.
   */
  dwg_getall_POLYLINE_2D(data) {
    return this.dwg_getall_entity_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_POLYLINE_2D
    );
  }
  /**
   * Returns all of 3d polyline entities in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of 3d polyline entities in Dwg_Data instance.
   */
  dwg_getall_POLYLINE_3D(data) {
    return this.dwg_getall_entity_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_POLYLINE_3D
    );
  }
  /**
   * Returns all of image entities in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of image entities in Dwg_Data instance.
   */
  dwg_getall_IMAGE(data) {
    return this.dwg_getall_entity_by_type(data, Dwg_Object_Type.DWG_TYPE_IMAGE);
  }
  /**
   * Returns all of lwpolyline entities in Dwg_Data instance.
   * @group GetAll Methods
   * @param data Pointer to Dwg_Data instance.
   * @returns Returns all of lwpolyline entities in Dwg_Data instance.
   */
  dwg_getall_LWPOLYLINE(data) {
    return this.dwg_getall_entity_by_type(
      data,
      Dwg_Object_Type.DWG_TYPE_LWPOLYLINE
    );
  }
  /**
   * Converts one C++ handle array to one JavaScript Dwg_Object_Ref array.
   * @group Array Methods
   * @param ptr Pointer to C++ handle array.
   * @param size The size of C++ handle array.
   * @returns Returns one JavaScript Dwg_Object_Ref array from the specified C++ handle array.
   */
  dwg_ptr_to_object_ref_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_object_ref_array(ptr, size);
  }
  /**
   * Converts one C++ handle array to one JavaScript Dwg_Object_Ref_Ptr array.
   * @group Array Methods
   * @param ptr Pointer to C++ handle array.
   * @param size The size of C++ handle array.
   * @returns Returns one JavaScript Dwg_Object_Ref_Ptr array from the specified C++ handle array.
   */
  dwg_ptr_to_object_ref_ptr_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_object_ref_ptr_array(ptr, size);
  }
  /**
   * Converts one C++ wchar_t* array to one JavaScript string array.
   * @group Array Methods
   * @param ptr Pointer to C++ wchar_t* array.
   * @param size The size of C++ wchar_t* array.
   * @returns Returns one JavaScript string array from the specified C++ wchar_t* array.
   */
  dwg_ptr_to_wchar_string_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_wchar_string_array(ptr, size);
  }
  /**
   * Converts one C++ unsigned char array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ unsigned char array.
   * @param size The size of C++ unsigned char array.
   * @returns Returns one JavaScript number array from the specified C++ unsigned char array.
   */
  dwg_ptr_to_unsigned_char_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_unsigned_char_array(ptr, size);
  }
  /**
   * Converts one C++ signed char array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ signed char array.
   * @param size The size of C++ signed char array.
   * @returns Returns one JavaScript number array from the specified C++ signed char array.
   */
  dwg_ptr_to_signed_char_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_signed_char_array(ptr, size);
  }
  /**
   * Converts one C++ unsigned int16 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ unsigned int16 array.
   * @param size The size of C++ unsigned int16 array.
   * @returns Returns one JavaScript number array from the specified C++ unsigned int16 array.
   */
  dwg_ptr_to_uint16_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_uint16_t_array(ptr, size);
  }
  /**
   * Converts one C++ int16 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ int16 array.
   * @param size The size of C++ int16 array.
   * @returns Returns one JavaScript number array from the specified C++ int16 array.
   */
  dwg_ptr_to_int16_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_int16_t_array(ptr, size);
  }
  /**
   * Converts one C++ unsigned int32 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ unsigned int32 array.
   * @param size The size of C++ unsigned int32 array.
   * @returns Returns one JavaScript number array from the specified C++ unsigned int32 array.
   */
  dwg_ptr_to_uint32_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_uint32_t_array(ptr, size);
  }
  /**
   * Converts one C++ int32 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ int32 array.
   * @param size The size of C++ int32 array.
   * @returns Returns one JavaScript number array from the specified C++ int32 array.
   */
  dwg_ptr_to_int32_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_int32_t_array(ptr, size);
  }
  /**
   * Converts one C++ unsigned int64 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ unsigned int64 array.
   * @param size The size of C++ unsigned int64 array.
   * @returns Returns one JavaScript number array from the specified C++ unsigned int64 array.
   */
  dwg_ptr_to_uint64_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_uint64_t_array(ptr, size);
  }
  /**
   * Converts one C++ int64 array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ int64 array.
   * @param size The size of C++ int64 array.
   * @returns Returns one JavaScript number array from the specified C++ int64 array.
   */
  dwg_ptr_to_int64_t_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_int64_t_array(ptr, size);
  }
  /**
   * Converts one C++ double array to one JavaScript number array.
   * @group Array Methods
   * @param ptr Pointer to C++ double array.
   * @param size The size of C++ double array.
   * @returns Returns one JavaScript number array from the specified C++ double array.
   */
  dwg_ptr_to_double_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_double_array(ptr, size);
  }
  /**
   * Converts one C++ 2d point array to one JavaScript 2d point array.
   * @group Array Methods
   * @param ptr Pointer to C++ 2d point array.
   * @param size The size of C++ 2 point array.
   * @returns Returns one JavaScript 2d point array from the specified C++ 2d point array.
   */
  dwg_ptr_to_point2d_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_point2d_array(ptr, size);
  }
  /**
   * Converts one C++ 3d point array to one JavaScript 3d point array.
   * @group Array Methods
   * @param ptr Pointer to C++ 3d point array.
   * @param size The size of C++ 3d point array.
   * @returns Returns one JavaScript 3d point array from the specified C++ 3d point array.
   */
  dwg_ptr_to_point3d_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_point3d_array(ptr, size);
  }
  /**
   * Converts one C++ 4d point array to one JavaScript 4d point array.
   * @group Array Methods
   * @param ptr Pointer to C++ 4d point array.
   * @param size The size of C++ 4d point array.
   * @returns Returns one JavaScript 4d point array from the specified C++ 4d point array.
   */
  dwg_ptr_to_point4d_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_point4d_array(ptr, size);
  }
  /**
   * Converts one C++ line type array to one JavaScript line type array.
   * @group Array Methods
   * @param ptr Pointer to C++ line type array.
   * @param size The size of C++ line type array.
   * @returns Returns one JavaScript line type array from the specified C++ line type array.
   */
  dwg_ptr_to_ltype_dash_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_ltype_dash_array(ptr, size);
  }
  /**
   * Converts one C++ table cell array to one JavaScript table cell array.
   * @group Array Methods
   * @group Dwg_Entity_TABLE Methods
   * @param ptr Pointer to C++ table cell array.
   * @param size The size of C++ table cell array.
   * @returns Returns one JavaScript table cell array from the specified C++ table cell array.
   */
  dwg_ptr_to_table_cell_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_table_cell_array(ptr, size);
  }
  /**
   * Converts one C++ hatch definition line array to one JavaScript hatch definition line array.
   * @group Array Methods
   * @group Dwg_Entity_HATCH Methods
   * @param ptr Pointer to C++ hatch definition line array.
   * @param size The size of C++ hatch definition line array.
   * @returns Returns one JavaScript hatch definition line array from the specified C++ hatch definition line array.
   */
  dwg_ptr_to_hatch_defline_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_hatch_defline_array(ptr, size);
  }
  /**
   * Converts one C++ hatch path array to one JavaScript hatch path array.
   * @group Array Methods
   * @group Dwg_Entity_HATCH Methods
   * @param ptr Pointer to C++ hatch path array.
   * @param size The size of C++ hatch path array.
   * @returns Returns one JavaScript hatch path array from the specified C++ hatch path array.
   */
  dwg_ptr_to_hatch_path_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_hatch_path_array(ptr, size);
  }
  /**
   * Converts one C++ hatch gradient color array to one JavaScript hatch gradient color array.
   * @group Array Methods
   * @group Dwg_Entity_HATCH Methods
   * @param ptr Pointer to C++ hatch gradient color array.
   * @param size The size of C++ hatch gradient color array.
   * @returns Returns one JavaScript hatch gradient color array from the specified C++ hatch gradient color array.
   */
  dwg_ptr_to_hatch_gradient_color_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_hatch_gradient_color_array(ptr, size);
  }
  /**
   * Converts one C++ mline vertex array to one JavaScript mline vertex array.
   * @group Array Methods
   * @group Dwg_Entity_MLINE Methods
   * @param ptr Pointer to C++ mline vertex array.
   * @param size The size of C++ mline vertex array.
   * @returns Returns one JavaScript mline vertex array from the specified C++ mline vertex array.
   */
  dwg_ptr_to_mline_vertex_array(ptr, size) {
    return this.wasmInstance.dwg_ptr_to_mline_vertex_array(ptr, size);
  }
  /**
   * Generic field value getter. Used to get the field value of one object or entity.
   * @group Dynamic API Methods
   * @param obj Pointer to one object or entity
   * @param field Field name of one object or entity
   * @returns Returns the field value of one object or entity.
   */
  dwg_dynapi_entity_value(obj, field) {
    const value = this.wasmInstance.dwg_dynapi_entity_value(
      obj,
      field
    );
    if (value.bin && this.decoder) {
      value.data = this.decoder.decode(value.bin);
    }
    if (typeof value.data === "string") {
      value.data = decodeUnicodeEscapes(value.data);
    }
    return value;
  }
  /**
   * Returns the decoded field data of one object or entity.
   * @group Dynamic API Methods
   */
  dwg_dynapi_entity_data(obj, field) {
    return this.dwg_dynapi_entity_value(obj, field).data;
  }
  /**
   * Header field value getter. Used to get the field value of dwg/dxf header.
   * @group Dynamic API Methods
   * @param data Pointer to Dwg_Data instance.
   * @param field Field name of header.
   * @returns Returns the field value of dwg/dxf header.
   */
  dwg_dynapi_header_value(data, field) {
    return this.wasmInstance.dwg_dynapi_header_value(data, field);
  }
  /**
   * Returns the field data of dwg/dxf header.
   * @group Dynamic API Methods
   */
  dwg_dynapi_header_data(data, field) {
    return this.dwg_dynapi_header_value(data, field).data;
  }
  /**
   * The common field value getter. Used to get the value of object or entity common fields.
   * @group Dynamic API Methods
   * @param obj Pointer to one object or entity
   * @param field The name of object or entity common fields.
   * @returns Returns the value of object or entity common fields.
   */
  dwg_dynapi_common_value(obj, field) {
    return this.wasmInstance.dwg_dynapi_common_value(obj, field);
  }
  /**
   * Returns the field data of object or entity common fields.
   * @group Dynamic API Methods
   */
  dwg_dynapi_common_data(obj, field) {
    return this.dwg_dynapi_common_value(obj, field).data;
  }
  /**
   * The field of one object or entity may not be primitive type. It means one field may consist of
   * multiple sub-fields. This method is used to get the sub-field value of those complex field.
   * @group Dynamic API Methods
   * @param obj Pointer to one object or entity.
   * @param subclass The class name of the field with complex type.
   * @param field The field name of one object or entit.
   * @returns Returns the sub-field value of one complex field.
   */
  dwg_dynapi_subclass_value(obj, subclass, field) {
    const value = this.wasmInstance.dwg_dynapi_subclass_value(
      obj,
      subclass,
      field
    );
    if (value.bin && this.decoder) {
      value.data = this.decoder.decode(value.bin);
    }
    if (typeof value.data === "string") {
      value.data = decodeUnicodeEscapes(value.data);
    }
    return value;
  }
  /**
   * Returns the sub-field data of one complex field.
   * @group Dynamic API Methods
   */
  dwg_dynapi_subclass_data(obj, subclass, field) {
    return this.dwg_dynapi_subclass_value(obj, subclass, field).data;
  }
  /**
   * Returns the struct size of a dynapi subclass.
   */
  dwg_dynapi_subclass_size(subclass) {
    return this.wasmInstance.dwg_dynapi_subclass_size(subclass);
  }
  /**
   * Returns the byte offset of a field within an entity struct.
   */
  dwg_dynapi_entity_field_offset(entity, field) {
    return this.wasmInstance.dwg_dynapi_entity_field_offset(entity, field);
  }
  /**
   * Returns the byte offset of a field within a dynapi subclass struct.
   */
  dwg_dynapi_subclass_field_offset(subclass, field) {
    return this.wasmInstance.dwg_dynapi_subclass_field_offset(subclass, field);
  }
  /**
   * Returns the handle of one Dwg_Object instance.
   * @group Dwg_Object Methods
   * @param ptr Pointer to one Dwg_Object instance.
   * @returns Returns the handle of one Dwg_Object instance.
   */
  dwg_object_get_handle_object(ptr) {
    return this.wasmInstance.dwg_object_get_handle_object(ptr);
  }
  /**
   * Returns the handle of one Dwg_Object_Object instance.
   * @group Dwg_Object_Object Methods
   * @param ptr Pointer to one Dwg_Object_Object instance.
   * @returns Returns the handle of one Dwg_Object_Object instance.
   */
  dwg_object_object_get_handle_object(ptr) {
    return this.wasmInstance.dwg_object_object_get_handle_object(ptr);
  }
  /**
   * Returns the owner handle of one Dwg_Object_Object instance.
   * @group Dwg_Object_Object Methods
   * @param ptr Pointer to one Dwg_Object_Object instance.
   * @returns Returns the owner handle of one Dwg_Object_Object instance.
   */
  dwg_object_object_get_ownerhandle_object(ptr) {
    return this.wasmInstance.dwg_object_object_get_ownerhandle_object(ptr);
  }
  /**
   * Returns the handle of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns the handle of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_handle_object(ptr) {
    return this.wasmInstance.dwg_object_entity_get_handle_object(ptr);
  }
  /**
   * Returns the owner handle of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns the owner handle of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_ownerhandle_object(ptr) {
    return this.wasmInstance.dwg_object_entity_get_ownerhandle_object(ptr);
  }
  /**
   * Returns hard-owner ID/handle to owner dictionary of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns hard-owner ID/handle to owner dictionary of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_xdicobjhandle_object(ptr) {
    return this.wasmInstance.dwg_object_entity_get_xdicobjhandle_object(ptr);
  }
  /**
   * Returns the layer handle of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns the layer handle of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_layer_object_ref(ptr) {
    return this.wasmInstance.dwg_object_entity_get_layer_object_ref(ptr);
  }
  /**
   * Returns the line type handle of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns the line type handle of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_ltype_object_ref(ptr) {
    return this.wasmInstance.dwg_object_entity_get_ltype_object_ref(ptr);
  }
  /**
   * Returns color value of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns color value of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_color_object(ptr) {
    return this.wasmInstance.dwg_object_entity_get_color_object(ptr);
  }
  /**
   * Returns xdata of one Dwg_Object_Entity instance.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns xdata of one Dwg_Object_Entity instance.
   */
  dwg_object_entity_get_xdata(ptr) {
    return this.wasmInstance.dwg_object_entity_get_xdata(ptr);
  }
  /**
   * Returns the extension dictionary handle of a Dwg_Object_Object instance.
   * @group Dwg_Object_Object Methods
   * @param ptr Pointer to one Dwg_Object_Object instance.
   * @returns Object ref for the extension dictionary, or null when absent.
   */
  dwg_object_object_get_xdicobjhandle_object(ptr) {
    return this.wasmInstance.dwg_object_object_get_xdicobjhandle_object(ptr);
  }
  /**
   * Returns XRECORD payload as DXF group-code / value pairs.
   * @group Dwg_Object_XRECORD Methods
   * @param ptr Pointer to one Dwg_Object_XRECORD instance (object tio).
   * @returns Array of `{ code, value }` groups.
   */
  dwg_object_xrecord_get_xdata(ptr) {
    return this.wasmInstance.dwg_object_xrecord_get_xdata(ptr) ?? [];
  }
  /**
   * Returns pointer to BLOCK_HEADER owner for generic entity from ent->ownerhandle.
   * @group Dwg_Object_Entity Methods
   * @param ptr Pointer to one Dwg_Object_Entity instance.
   * @returns Returns pointer to BLOCK_HEADER owner.
   */
  dwg_entity_owner(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_owner(ptr);
  }
  /**
   * Returns block name of one Dwg_Entity_* instance with one block field. For example,
   * dimension entities have one 'block' field which represents the block that contains
   * the entities that make up the dimension picture.
   * @group Dwg_Entity_* Methods
   * @param ptr Pointer to one Dwg_Entity_* instance  with one block field.
   * @param field Field name of the block.
   * @returns Returns block name of one Dwg_Entity_* instance.
   */
  dwg_entity_get_block_name(ptr, field) {
    const wasmInstance = this.wasmInstance;
    const block_header_ref = this.dwg_dynapi_entity_data(ptr, field);
    const block_header_obj = wasmInstance.dwg_ref_get_object(block_header_ref);
    const block_header_tio = wasmInstance.dwg_object_to_object_tio(block_header_obj);
    const block = this.dwg_entity_block_header_get_block(block_header_tio);
    return block.name;
  }
  /**
   * Returns dimension style name of one Dwg_Entity_* instance with one dimension style
   * field.
   * @group Dwg_Entity_* Methods
   * @param ptr Pointer to one Dwg_Entity_* instance.
   * @param field Field name of the dimension style.
   * @returns Returns dimension style name of one Dwg_Entity_* instance.
   */
  dwg_entity_get_dimstyle_name(ptr, field = "dimstyle") {
    const wasmInstance = this.wasmInstance;
    const dimstyle_ref = this.dwg_dynapi_entity_data(ptr, field);
    const dimstyle_obj = wasmInstance.dwg_ref_get_object(dimstyle_ref);
    const dimstyle_tio = wasmInstance.dwg_object_to_object_tio(dimstyle_obj);
    const dimstyle_name = this.dwg_dynapi_entity_data(dimstyle_tio, "name");
    return dimstyle_name;
  }
  /**
   * Returns block entity pointed by the specified block header.
   * @group Dwg_Entity_BLOCK_HEADER Methods
   * @param ptr Pointer to one Dwg_Entity_BLOCK_HEADER instance.
   * @returns Returns block entity pointed by the specified block header.
   */
  dwg_entity_block_header_get_block(ptr) {
    const wasmInstance = this.wasmInstance;
    const block_ref = this.dwg_dynapi_entity_data(ptr, "block_entity");
    const block_obj = wasmInstance.dwg_ref_get_object(block_ref);
    const block_tio = wasmInstance.dwg_object_to_entity_tio(block_obj);
    const name = this.dwg_dynapi_entity_data(block_tio, "name");
    const base_pt = this.dwg_dynapi_entity_data(block_tio, "base_pt");
    return {
      name,
      base_pt
      // preR13 only
    };
  }
  /**
   * Returns preview image of the block pointed by the specified block header.
   * @group Dwg_Entity_BLOCK_HEADER Methods
   * @param ptr Pointer to one Dwg_Entity_BLOCK_HEADER instance.
   * @returns Returns preview image of the block pointed by the specified block header.
   */
  dwg_entity_block_header_get_preview(ptr) {
    const wasm = this.wasmInstance;
    if (typeof wasm.dwg_entity_block_header_get_preview !== "function") {
      return null;
    }
    const result = wasm.dwg_entity_block_header_get_preview(ptr);
    return (result == null ? void 0 : result.data) ?? null;
  }
  /**
   * Returns preview binary data of one entity (common entity preview field).
   * For PROXY_ENTITY this contains the proxy graphics data.
   */
  dwg_entity_get_preview(ptr) {
    const wasm = this.wasmInstance;
    if (typeof wasm.dwg_entity_get_preview !== "function") {
      return null;
    }
    const result = wasm.dwg_entity_get_preview(ptr);
    return (result == null ? void 0 : result.data) ?? null;
  }
  /**
   * Returns entity binary data of one Dwg_Entity_PROXY_ENTITY instance.
   * @group Dwg_Entity_PROXY_ENTITY Methods
   * @param ptr Pointer to one Dwg_Entity_PROXY_ENTITY instance.
   * @returns Entity data bytes, or null when absent.
   */
  dwg_entity_proxy_entity_get_entity_data(ptr) {
    const wasm = this.wasmInstance;
    if (typeof wasm.dwg_entity_proxy_entity_get_entity_data !== "function") {
      return null;
    }
    const result = wasm.dwg_entity_proxy_entity_get_entity_data(ptr);
    return (result == null ? void 0 : result.data) ?? null;
  }
  /**
   * Returns binary OLE payload of one Dwg_Entity_OLE2FRAME instance.
   * Uses data_size so embedded NUL bytes are preserved (unlike dynapi TF).
   * @group Dwg_Entity_OLE2FRAME Methods
   */
  dwg_entity_ole2frame_get_data(ptr) {
    const wasm = this.wasmInstance;
    if (typeof wasm.dwg_entity_ole2frame_get_data !== "function") {
      return null;
    }
    const result = wasm.dwg_entity_ole2frame_get_data(ptr);
    return (result == null ? void 0 : result.data) ?? null;
  }
  /**
   * Returns binary OLE payload of one Dwg_Entity_OLEFRAME instance.
   * Uses data_size so embedded NUL bytes are preserved (unlike dynapi TF).
   * @group Dwg_Entity_OLEFRAME Methods
   */
  dwg_entity_oleframe_get_data(ptr) {
    const wasm = this.wasmInstance;
    if (typeof wasm.dwg_entity_oleframe_get_data !== "function") {
      return null;
    }
    const result = wasm.dwg_entity_oleframe_get_data(ptr);
    return (result == null ? void 0 : result.data) ?? null;
  }
  /**
   * Returns the first entity owned by the block header or null
   * @group Dwg_Entity_BLOCK_HEADER Methods
   * @param ptr Pointer to the block header.
   * @returns Returns the first entity owned by the block header or null
   */
  get_first_owned_entity(ptr) {
    return this.wasmInstance.get_first_owned_entity(ptr);
  }
  /**
   * Returns the next entity owned by the block header or null.
   * @group Dwg_Entity_BLOCK_HEADER Methods
   * @param ptr Pointer to the block header.
   * @param current Pointer to the current entity in the block header.
   * @returns Returns the next entity owned by the block header or null.
   */
  get_next_owned_entity(ptr, current) {
    return this.wasmInstance.get_next_owned_entity(ptr, current);
  }
  /**
   * Returns text style name of one Dwg_Entity_MTEXT instance.
   * @group Dwg_Entity_MTEXT Methods
   * @param ptr Pointer to one Dwg_Entity_MTEXT instance.
   * @returns Returns text style name of one Dwg_Entity_MTEXT instance.
   */
  dwg_entity_mtext_get_style_name(ptr) {
    const wasmInstance = this.wasmInstance;
    const style_ref = this.dwg_dynapi_entity_data(ptr, "style");
    const style_obj = wasmInstance.dwg_ref_get_object(style_ref);
    const style_tio = wasmInstance.dwg_object_to_object_tio(style_obj);
    const name = this.dwg_dynapi_entity_data(style_tio, "name");
    return name;
  }
  /**
   * Returns text style name of one Dwg_Entity_TEXT instance.
   * @group Dwg_Entity_TEXT Methods
   * @param ptr Pointer to one Dwg_Entity_TEXT instance.
   * @returns Returns text style name of one Dwg_Entity_TEXT instance.
   */
  dwg_entity_text_get_style_name(ptr) {
    return this.dwg_entity_mtext_get_style_name(ptr);
  }
  /**
   * Returns the number of points in Dwg_Entity_POLYLINE_2D.
   * @group Dwg_Entity_POLYLINE_2D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_2D) instance.
   * @returns Returns the number of points in one Dwg_Entity_POLYLINE_2D.
   */
  dwg_entity_polyline_2d_get_numpoints(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_2d_get_numpoints(ptr).data;
  }
  /**
   * Returns points in Dwg_Entity_POLYLINE_2D.
   * @group Dwg_Entity_POLYLINE_2D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_2D) instance.
   * @returns Returns points in one Dwg_Entity_POLYLINE_2D.
   */
  dwg_entity_polyline_2d_get_points(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_2d_get_points(ptr).data;
  }
  /**
   * Returns vertices in Dwg_Entity_POLYLINE_2D.
   * @group Dwg_Entity_POLYLINE_2D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_2D) instance.
   * @returns Returns vertices in one Dwg_Entity_POLYLINE_2D.
   */
  dwg_entity_polyline_2d_get_vertices(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_2d_get_vertices(ptr).data;
  }
  /**
   * Returns the number of points in Dwg_Entity_POLYLINE_3D.
   * @group Dwg_Entity_POLYLINE_3D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_3D) instance.
   * @returns Returns the number of points in one Dwg_Entity_POLYLINE_3D.
   */
  dwg_entity_polyline_3d_get_numpoints(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_3d_get_numpoints(ptr).data;
  }
  /**
   * Returns points in Dwg_Entity_POLYLINE_3D.
   * @group Dwg_Entity_POLYLINE_3D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_3D) instance.
   * @returns Returns points in one Dwg_Entity_POLYLINE_3D.
   */
  dwg_entity_polyline_3d_get_points(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_3d_get_points(ptr).data;
  }
  /**
   * Returns vertices in Dwg_Entity_POLYLINE_3D.
   * @group Dwg_Entity_POLYLINE_3D Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_POLYLINE_3D) instance.
   * @returns Returns vertices in one Dwg_Entity_POLYLINE_3D.
   */
  dwg_entity_polyline_3d_get_vertices(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_polyline_3d_get_vertices(ptr).data;
  }
  /**
   * Returns attributes associated with INSERT entity.
   * @group Dwg_Entity_INSERT Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Entity_INSERT) instance.
   * @returns Returns attributes associated with INSERT entity.
   */
  dwg_entity_insert_get_attribs(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_entity_insert_get_attribs(ptr).data;
  }
  /**
   * Returns texts in Dwg_Object_DICTIONARY.
   * @group Dwg_Object_DICTIONARY Methods
   * @param ptr Pointer to one Dwg_Object (not Dwg_Object_DICTIONARY) instance.
   * @returns Returns texts in one Dwg_Object_DICTIONARY.
   */
  dwg_object_dictionary_get_texts(ptr) {
    const wasmInstance = this.wasmInstance;
    return wasmInstance.dwg_object_dictionary_get_texts(ptr).data;
  }
  static createByWasmInstance(wasmInstance) {
    return this.instance == null ? new _LibreDwg(wasmInstance) : this.instance;
  }
  static async create(filepath) {
    const wasmInstance = filepath == null ? await createModule() : await createModule({
      locateFile: (filename) => {
        return `${filepath}/${filename}`;
      }
    });
    return this.createByWasmInstance(wasmInstance);
  }
};
__publicField(_LibreDwg, "instance");
let LibreDwg = _LibreDwg;
export {
  DwgAttachmentPoint,
  DwgBoundaryPathEdgeType,
  DwgBoundaryPathTypeFlag,
  DwgCodePage,
  DwgDictionaryCloningFlags,
  DwgDimensionTextHorizontal,
  DwgDimensionTextLineSpacing,
  DwgDimensionTextVertical,
  DwgDimensionToleranceTextVertical,
  DwgDimensionType,
  DwgDimensionZeroSuppression,
  DwgDimensionZeroSuppressionAngular,
  DwgHatchAssociativity,
  DwgHatchBoundaryAnnotation,
  DwgHatchGradientColorFlag,
  DwgHatchGradientFlag,
  DwgHatchPatternType,
  DwgHatchSolidFill,
  DwgHatchStyle,
  DwgPolylineFlag,
  DwgProxyOriginalDataFormat,
  DwgSmoothType,
  DwgTextGenerationFlag,
  DwgTextHorizontalAlign,
  DwgTextVerticalAlign,
  DwgThumbnailImageType,
  Dwg_Color_Method,
  Dwg_Error,
  Dwg_File_Type,
  Dwg_Hatch_Edge_Type,
  Dwg_Object_Supertype,
  Dwg_Object_Type,
  Dwg_Object_Type_Inverted,
  HEADER_VARIABLES,
  LibreDwg,
  default2 as createModule,
  decodeUnicodeEscapes,
  dwgCodePageToEncoding,
  dwgVersions
};

