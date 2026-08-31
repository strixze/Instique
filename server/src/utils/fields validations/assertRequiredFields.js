
import { ApiError } from "../apiUtils.js";


 

export const assertRequiredFields = (fields=[]) =>{     // return true only if all fields are non empty
    for(let field of fields){
        if(field){
           if(field.trim() === "" ){
            throw new ApiError(400,"All Fields are Required.")
           }
        }
        else{
           throw new ApiError(400,"All Fields are Required.")
        }
    }

}


