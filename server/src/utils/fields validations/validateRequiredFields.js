
/**
@description: Utility function to check if required fields are present and non-empty in a request body.
              This function takes an array of field names (Strings) and checks if they are present and non-empty in the request body. It returns true if all fields are valid, otherwise it throws an error with a message indicating which field is missing or empty.
*/
import { ApiError } from "../apiUtils";
import { asyncHandler } from "../asyncHandler";

 

export const validateRequiredFields = (fields=[]) =>{     // return true only if all fields are non empty
    for(let field of fields){
        if(field){
           if(field.trim() === "" ){
            return false
           }
        }
        else{
           return false
        }
    }

    return true
}


