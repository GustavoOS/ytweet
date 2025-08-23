import type { PostTable } from "@worker/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitialsFromName } from "@/utils/name";
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from "dayjs";

dayjs.extend(relativeTime);

type PostProps = {
    post: InferSelectModel<typeof PostTable>
}

export function Post(props: PostProps) {
    const {post} = props;
    return <div className="border border-amber-50/25 flex flex-col w-full rounded-md">
        <div className="flex flex-row gap-2 p-4">
            <Avatar>
                <AvatarImage src={post.profilePicture ?? ""} />
                <AvatarFallback>{nameInitialsFromName(post.authorName!)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-amber-100 font-semibold">{props.post.authorName}</span>
                <span className="text-zinc-400 text-sm">{dayjs(props.post.createdAt).fromNow()}</span>
            </div>
        </div>
        <div className="p-4 text-zinc-200">
            {props.post.content}
        </div>
    </div>
}
