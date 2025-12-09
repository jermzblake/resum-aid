import { LLMFactory } from '../providers/llm-factory'

async function main() {
  const llm = LLMFactory.createOllama('gpt-oss:120b-cloud')

  // Non-streaming chat
  const resp = await llm.chat({
    messages: [{ role: 'user', content: 'Write a short friendly intro sentence about myself for a resume.' }],
    temperature: 0.2,
    maxTokens: 150,
  })
  console.log('Non-streaming response:\n', resp.content)

  // Streaming chat
  console.log('\nStreaming response:')
  const stream = await llm.chatStream({
    messages: [{ role: 'user', content: 'Write a short friendly intro sentence about myself for a resume.' }],
    temperature: 0.2,
    maxTokens: 150,
    stream: true,
  })

  for await (const chunk of stream) {
    // chunk is a string chunk emitted by provider
    process.stdout.write(chunk)
  }
  console.log('\n-- stream finished --')

  // Using the helper prompt
  const quick = await llm.prompt('Provide three bullet points that highlight teamwork skills.')
  console.log('\nPrompt helper result:\n', quick)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exitCode = 1
})
