var getmedia = require('get-user-media');
var unpacker = require('uart-unpack-frame');
var through = require('through2');

getmedia({ audio: true }, function (err, stream) {
    if (err) return console.error(err);
    var Context = global.AudioContext || global.webkitAudioContext;
    var context = new Context;
    var win = context.sampleRate / 4800;
    var mstream = context.createMediaStreamSource(stream);
    var unpack = unpacker({ polarity: 1 });
    unpack.pipe(through(function (buf, enc, next) {
        console.log('buf=', [].slice.call(buf));
document.body.appendChild(document.createTextNode(buf.toString() + ' '));
        next();
    }));
    
    var sproc = context.createScriptProcessor(2048, 1, 1);
    sproc.addEventListener('audioprocess', onaudio);
    var MIN = 0.001;
    var bytev = 0;
    var bytepos = 0;
    
    mstream.connect(sproc);
    sproc.connect(sproc.context.destination);
    
    function onaudio (ev) {
        var input = ev.inputBuffer.getChannelData(0);
        var prev = input[0] > 0 ? 1 : 0;
        var last = 0;
        var bytes = [];
        if (Math.abs(prev) < MIN) prev = null;
var bits = []; 
        
        for (var i = 1; i < input.length; i++) {
            if (Math.abs(input[i]) < MIN) {
bits.push('X'); 
                prev = null;
                continue;
            }
            var cur = input[i] > 0 ? 1 : 0;
            if (prev === null) {
                prev = cur;
                last = i;
                continue;
            }
bits.push(cur);
            
            if (cur ^ prev) {
                var dist = i - last;
                last = i;
                
                var nbits = Math.round(dist / win);
                for (var j = 0; j < nbits; j++) {
                    bytev += prev << bytepos;
                    if (++bytepos === 8) {
                        bytes.push(bytev);
                        bytev = 0;
                        bytepos = 0;
                    }
                }
            }
            prev = cur;
        }
        if (bytes.length) unpack.write(Buffer(bytes));
if (/[01]/.test(bits.join(''))) console.log(bits.join('')); 
    }
});
