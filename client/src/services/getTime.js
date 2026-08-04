export const getTime = (timestamp)=>{
    const timeList = new Date(timestamp).toLocaleTimeString().split(' ')
    let timeString = timeList[0].split(':')
    timeString.pop()
    timeString = `${timeString.join(":")} ${timeList[1]}`
    // console.log("Formatted Time:",timeString);
    return timeString;
}