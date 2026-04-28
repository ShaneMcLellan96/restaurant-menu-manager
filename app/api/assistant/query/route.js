import { NextResponse } from 'next/server';
import { queryMenuStream } from '@/lib/rag';
import { getDefaultRestaurantId } from '@/lib/defaultRestaurant';

export const runtime = 'nodejs';

export async function POST(request) {
  const { restaurantId, question } = await request.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  const rid = restaurantId || (await getDefaultRestaurantId());

  try {
    const claudeStream = await queryMenuStream({ restaurantId: rid, question });

    // Convert Anthropic stream to a Web ReadableStream of SSE chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const errData = JSON.stringify({ error: err.message });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Assistant query error:', err);
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}
