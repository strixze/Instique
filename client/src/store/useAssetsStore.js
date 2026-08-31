import {create} from "zustand";
import {devtools} from "zustand/middleware";

export const useAssetsStore = create(
    devtools(
        (set)=>({
            scrollToBottomInChat:false,

            setScrollToBottomInChat:(value)=>(
                set({scrollToBottomInChat:value})
                ),

            selectFile:false,

            toggleSlectFile:(val)=>{
                set((state)=>({
                    selectFile:val
                }))
            }
        }),



    )
)
