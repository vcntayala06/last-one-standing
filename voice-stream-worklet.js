"use strict";

class LosPcm16Worklet extends AudioWorkletProcessor{
 constructor(){super();this.targetRate=16000;this.chunkSamples=800;this.source=[];this.output=[];this.position=0}
 process(inputs){
  const channel=inputs[0]?.[0];if(!channel?.length)return true;
  for(let i=0;i<channel.length;i++)this.source.push(channel[i]);
  const ratio=sampleRate/this.targetRate;
  while(this.position+1<this.source.length){
   const left=Math.floor(this.position),fraction=this.position-left,sample=this.source[left]+(this.source[left+1]-this.source[left])*fraction;
   this.output.push(Math.max(-1,Math.min(1,sample)));this.position+=ratio
  }
  const consumed=Math.floor(this.position);if(consumed){this.source.splice(0,consumed);this.position-=consumed}
  while(this.output.length>=this.chunkSamples){const pcm=new Int16Array(this.chunkSamples);for(let i=0;i<pcm.length;i++){const value=this.output[i];pcm[i]=value<0?value*0x8000:value*0x7fff}this.output.splice(0,this.chunkSamples);this.port.postMessage(pcm.buffer,[pcm.buffer])}
  return true
 }
}
registerProcessor("los-pcm16-worklet",LosPcm16Worklet);
