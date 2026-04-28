import ChatInterface from '@/components/ChatInterface';

export default function AssistantPage() {
  const restaurantId = process.env.DEFAULT_RESTAURANT_ID ?? '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Menu Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about the menu — ingredients, allergens, recommendations, and more.
        </p>
      </div>
      <ChatInterface restaurantId={restaurantId} />
    </div>
  );
}
