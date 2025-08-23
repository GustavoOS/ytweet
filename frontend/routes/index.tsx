import CreatePost from '@/components/posts/create'
import { Post } from '@/components/posts/post'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc'
import { SignedIn, SignedOut, SignInButton, SignOutButton } from '@clerk/clerk-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage
})

function IndexPage() {

  const {data: posts} = api.posts.all.useQuery();
    
  return <div className='flex flex-col gap-4 w-full'>
    <div className='flex flex-row justify-end'>
        <SignedIn>
            <Button size="sm" asChild><SignOutButton /></Button>
        </SignedIn>
        <SignedOut>
            <Button size="sm" asChild><SignInButton /></Button>
        </SignedOut>
    </div>
    <CreatePost />
    {posts?.map((post, idx) => <Post key={idx} post={post} />)}
  </div>
}
