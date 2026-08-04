/**
 * @returns boolean/ throw error
 * @param {Object} group 
 * @param {ObjectId} memberId 
 */
export const isMemberAlreadyInGroup =  (group,memberId)=>{

   return group.admins.some(admin => admin.toString() === memberId.toString())
      
}