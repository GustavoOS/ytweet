import { useUser } from "@clerk/clerk-react"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { nameInitialsFromName } from "@/utils/name"
import { Button } from "../ui/button"
import { useState } from "react"
import { api } from "@/trpc"

export default function CreatePost() {
    const [form, setForm] = useState<string | undefined>()
    const { user } = useUser()
    const utils = api.useUtils();
    const userInitials = nameInitialsFromName(user?.fullName ?? "")
    
    const createPost = api.posts.create.useMutation({
        onSuccess: () => {
            utils.posts.all.invalidate()
        }
    })

    if (!user) {
        return <div className="text-amber-100">Sign in to create a post.</div>
    }

    function handleCreatePost() {
        if (!form || form.trim() === "") {
            return;
        }
        createPost.mutate({content: form!})
        setForm(""); // Clear the input after posting
    }

    return <div className="flex flex-col w-full gap-2 border border-amber-50/20 p-4 rounded-md">
        <div className="flex flex-row gap-2">
            <Avatar>
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <input type="text" placeholder="What are you up to?" 
                className="bg-zinc-800 rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-zinc-600" 
                value={form} onChange={(e) => setForm(e.target.value)} />

        </div>
        <div className="flex flex-row w-full justify-end">
            <Button size="lg" onClick={handleCreatePost}
            className="bg-blue-300 hover:bg-blue-300/80">Post it!</Button>
        </div>
    </div>
}
