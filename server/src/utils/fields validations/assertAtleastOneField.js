
export const assertAtleastOneField = (fields=[]) =>{     // return true only if all fields are non empty
    for(let field of fields){
        if(field){
              if(field.trim() !== "" ){ // if atleast one field is non empty return true
                return true
              }
        }
    }

    throw new ApiError(400,"Atleast one field is required.")    
}