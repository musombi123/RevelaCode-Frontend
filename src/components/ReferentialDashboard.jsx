"use client";

import React,{useState} from "react";

import StudyLayout
from "@/components/study/StudyLayout";

import StudyFeed
from "@/components/study/StudyFeed";

import StudyReader
from "@/components/study/StudyReader";

export default function StudyDashboard(){

const[
selectedMaterial,
setSelectedMaterial
]=useState(null);


/* DEBUG */

console.log(
"Selected Material:",
selectedMaterial
);


/* OPEN READER */

if(
selectedMaterial?.id
){

return(

<StudyReader

materialId={
selectedMaterial.id
}

onBack={()=>{

setSelectedMaterial(
null
);

}}

/>

)

}


return(

<StudyLayout>

<StudyFeed

onOpen={(material)=>{

console.log(
"Card clicked:",
material
);

setSelectedMaterial({

...material,

id:
material.id||
material._id||
material.material_id

});

}}

/>

</StudyLayout>

)

}