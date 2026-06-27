import { notFound } from 'next/navigation'
import { markDone } from '@/lib/habits'
import Celebration from './Celebration'

export default async function DonePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await markDone(token)
  if (!result) notFound()

  const { habit, marked, streak } = result

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-sm w-full text-center">
        <Celebration
          emoji={habit.emoji}
          habitName={habit.name}
          streak={streak}
          marked={marked}
        />
      </div>
    </main>
  )
}
