"use client";

import React,{useEffect,useState} from "react";
import {Bookmark} from "lucide-react";

import{
Card,
CardContent
}
from "@/components/ui/Card";

const API=
"https://revelacode-backend.onrender.com";

export default function BookmarksPanel({

onOpen

}){

const[
bookmarks,
setBookmarks
]=useState([]);

const[
loading,
setLoading
]=useState(true);


useEffect(()=>{

loadBookmarks();

},[]);


async function loadBookmarks(){

try{

const res=
await fetch(

`${API}/study/bookmarks/001`

);

if(!res.ok){

throw new Error(
"Failed to fetch bookmarks"
);

}

const data=
await res.json();

const normalized=(

data.bookmarks||[]

).map(item=>({

...item,

id:
item.id||
item._id

}));

setBookmarks(
normalized
);

}catch(err){

console.log(
"Bookmarks Error:",
err
);

setBookmarks([]);

}
finally{

setLoading(
false
);

}

}


if(loading){

return(

<div>

<h2
className="
mb-4
text-xl
font-bold">

Saved Lessons

</h2>

<p
className="
text-gray-500">

Loading bookmarks...

</p>

</div>

)

}


return(

<div>

<h2
className="
mb-4
text-xl
font-bold">

Saved Lessons

</h2>

{

bookmarks.length===0?

(

<p
className="
text-gray-500">

No saved lessons yet.

</p>

)

:

(

<div
className="
space-y-3">

{

bookmarks.map(

item=>(

<Card

key={
item.id
}

className="
cursor-pointer
transition-shadow
hover:shadow-md"

onClick={()=>{

console.log(
"Opening:",
item
);

onOpen?.(
item
);

}}

>

<CardContent
className="
flex
items-center
gap-3
p-4">

<Bookmark
className="
h-5
w-5
text-indigo-600"
/>

<div>

<p
className="
font-medium">

{
item.title
}

</p>

<p
className="
text-xs
text-gray-500">

Tap to open →

</p>

</div>

</CardContent>

</Card>

)

)

}

</div>

)

}

</div>

)

}