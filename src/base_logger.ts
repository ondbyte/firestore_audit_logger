import { firestore } from "firebase-admin";

function isBoolean(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "Boolean";
}

function isTimeStamp(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "Timestamp";
}

function isNumber(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "Number";
}

function isDocReference(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "DocumentReference";
}

function isString(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "String";
}

function isArray(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "Array";
}

function isObject(value):boolean{
    if(!value){
        return false;
    }
    return value.constructor.name === "Object";
}

function setDeepProperty(obj, key:string, oldValue,newValue,description:string) {
    if(!obj){
        throw "obj cannot be null";
    }
    const tags = key.split("."),
      len = tags.length - 1;
    for (let i = 0; i < len; i++) {
      obj = obj[tags[i]];
      if(!obj){
          obj = {}
          obj[tags[i]] = obj;
      }
    }
    obj[tags[len]] = {
        "oldValue":oldValue,
        "newValue":newValue,
        "description": description

    };
    return obj;
  }

  function formatPossibleTimeStamp(t):string{
    if(t){
        return (t.toDate() as Date).toISOString();
    }
    return null;
}

function formatPossibleDocRef(t):string{
    if(t){
        return t.path;
    }
    return null;
}


function processValue(key:string,obj,oldValue:unknown,newValue:unknown){   
    if(newValue !== oldValue){
        if(isBoolean(newValue)||isBoolean(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"updated the date/time property "+key+" from "+oldValue+" to "+ newValue,)
        } else if(isTimeStamp(newValue)||isTimeStamp(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"updated the date/time property "+key+" from "+formatPossibleTimeStamp(oldValue)+" to "+ formatPossibleTimeStamp(newValue),);
        } else if(isNumber(newValue)||isNumber(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"updated the count/value of the property "+key+" from "+oldValue+" to "+ newValue,);
        } else if(isDocReference(newValue)||isDocReference(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"Updated the DocumentReference property "+key+" from "+formatPossibleDocRef(oldValue)+" to "+ formatPossibleDocRef(newValue),);
        } else if(isString(newValue)||isString(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"Updated the value of the property "+key+" from "+oldValue+" to "+ newValue,);
        } else if(isArray(newValue)||isArray(oldValue)){
            return setDeepProperty(obj,key,oldValue,newValue,"Updated the list of the values of the property "+key+" from "+oldValue+" to "+ newValue,);
        } else if(isObject(newValue)||isObject(oldValue)){
            return processMap(key,obj,oldValue,newValue);
        }
    }    
    return obj;

}

function processMap(parentKey:string,obj,oldData:firestore.DocumentData,newData:firestore.DocumentData){
    if(isObject(newData)||isObject(oldData)){
        let dataWithAllKeys;
        if(Object.keys(newData).length>=Object.keys(oldData).length){
            dataWithAllKeys = newData;
        }else{
            dataWithAllKeys = oldData;
        }
        for(let key of Object.keys(dataWithAllKeys)){
            const newValue = newData[key];
            const oldValue = oldData[key];
            if(parentKey!==null){
                key = parentKey+"."+key;
            }
            obj = processValue(key,obj,oldValue,newValue);
        }
    }
    return obj;
}

function processDoc(oldData:firestore.DocumentData,newData:firestore.DocumentData){
    return processMap(null,{},oldData,newData);
}


export function log(olddata:firestore.DocumentData,newdata:firestore.DocumentData,):Record<string,unknown> {
    return processDoc(olddata,newdata);
}
