
/**
 * @description Custom utility function .
 *
 * It takes two arrays of user IDs and returns a new array containing IDs that appear
 * in only one of the arrays (i.e., IDs that are not present in both arrays).
 *
 * @param {Array<string|ObjectId>} ids1 - First array of user IDs
 * @param {Array<string|ObjectId>} ids2 - Second array of user IDs
 *
 * @returns {string[]} Array of unique user IDs that exist in only one of the input arrays
 */
export const getUniqueMembers = (ids1=[],ids2=[]) =>{      

    const idsMap = {}

    for(let id of ids1){
        idsMap[id.toString()]=1
    }
    
    for(let id of ids2){
        let key = id.toString()
        idsMap[key] = !idsMap[key] ? 1 : idsMap[key]+1 
    }

    const ids = Object.keys(idsMap)

    const userIds = ids.filter(id => idsMap[id]===1)

    return userIds

}