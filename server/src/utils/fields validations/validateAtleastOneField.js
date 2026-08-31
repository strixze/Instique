
export const validateAtleastOneField = (fields=[]) =>{     // return true only if all fields are non empty
    for(let field of fields){
        if(field){
              if(field.trim() !== "" ){ // if atleast one field is non empty return true
                return true
              }
        }
    }

    return false
}