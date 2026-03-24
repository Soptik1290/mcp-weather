import re

with open('mobile/src/screens/HomeScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Capture the AI Summary block
ai_summary_regex = r"(                                    {/\* AI Summary — Pro/Ultra only \*/}\n                                    {tier !== 'free' && \(aiSummary \|\| aiLoading\) && \(\n                                        <AnimatedCard index=\{0\}>\n                                            <View style=\{\[styles\.aiCard, \{ backgroundColor: cardBg \}\]\}>\n                                                <Sparkles size=\{24\} color=\"#F59E0B\" fill=\"#F59E0B\" style=\{styles\.aiIcon\} />\n                                                <View style=\{styles\.aiContent\}>\n                                                    <Text style=\{\[styles\.aiTitle, \{ color: textColor \}\]\}>\n                                                        \{t\('ai_summary', lang\)\}\n                                                    </Text>\n                                                    \{aiLoading \? \(\n                                                        <View style=\{\{ gap: 8, marginTop: 4 \}\}>\n                                                            <View style=\{\[styles\.skeletonLine, \{ width: '100%', backgroundColor: isDark \? 'rgba\(255,255,255,0\.08\)' : 'rgba\(0,0,0,0\.06\)' \}\]\} />\n                                                            <View style=\{\[styles\.skeletonLine, \{ width: '85%', backgroundColor: isDark \? 'rgba\(255,255,255,0\.08\)' : 'rgba\(0,0,0,0\.06\)' \}\]\} />\n                                                            <View style=\{\[styles\.skeletonLine, \{ width: '60%', backgroundColor: isDark \? 'rgba\(255,255,255,0\.08\)' : 'rgba\(0,0,0,0\.06\)' \}\]\} />\n                                                        </View>\n                                                    \) : \(\n                                                        <Text style=\{\[styles\.aiSummary, \{ color: subTextColor \}\]\}>\n                                                            \{aiSummary\}\n                                                        </Text>\n                                                    \)\}\n                                                </View>\n                                            </View>\n                                        </AnimatedCard>\n                                    \)\}\n\n)"

match = re.search(ai_summary_regex, text)
if not match:
    print("AI Summary block not found!")
    exit(1)

ai_summary_block = match.group(1)

# Remove the block from the original place
text = text.replace(ai_summary_block, "")

# Shift the indexing inside the block to 5.
new_ai_summary_block = ai_summary_block.replace("<AnimatedCard index={0}>", "<AnimatedCard index={5}>")

# 2. Re-index elements 1-5 to 0-4
text = text.replace("<AnimatedCard index={1}>", "<AnimatedCard index={0}>")
text = text.replace("<AnimatedCard index={2}>", "<AnimatedCard index={1}>")
text = text.replace("<AnimatedCard index={3}>", "<AnimatedCard index={2}>")
text = text.replace("<AnimatedCard index={4}>", "<AnimatedCard index={3}>")
text = text.replace("<AnimatedCard index={5}>", "<AnimatedCard index={4}>")

# We want to inject new_ai_summary_block just BEFORE daily_forecast which has index 6

target_insertion = r"""                                    {/\* Daily Forecast \*/}
                                    {weather\?\.daily_forecast && weather\.daily_forecast\.length > 0 && \(
                                        <AnimatedCard index=\{6\}>"""

insertion_match = re.search(target_insertion, text)
if not insertion_match:
    print("Target insertion point not found!")
    exit(1)

text = text.replace("                                    {/* Daily Forecast */}", new_ai_summary_block + "                                    {/* Daily Forecast */}")


with open('mobile/src/screens/HomeScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replacement successful!")
