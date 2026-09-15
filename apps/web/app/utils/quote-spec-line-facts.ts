export type QuoteSpecLineName = {
  readonly name: string;
};

export function quoteSpecLineFacts(
  questionnaireLines: readonly QuoteSpecLineName[],
  quoteLines: readonly QuoteSpecLineName[],
): readonly string[] {
  const questionnaireNames = namesInFileOrder(questionnaireLines);
  const quoteNames = namesInFileOrder(quoteLines);
  const quoteSet = new Set(quoteNames);
  const questionnaireSet = new Set(questionnaireNames);

  const onlyQuestionnaire = questionnaireNames
    .filter((name) => !quoteSet.has(name))
    .map((name) => `В опросе есть «${name}», в КП этой строки нет.`);
  const onlyQuote = quoteNames
    .filter((name) => !questionnaireSet.has(name))
    .map((name) => `В КП есть «${name}», в опросе его нет.`);
  const inBoth = questionnaireNames
    .filter((name) => quoteSet.has(name))
    .map((name) => `«${name}» есть в опросе и в КП.`);

  return [...onlyQuestionnaire, ...onlyQuote, ...inBoth];
}

function namesInFileOrder(lines: readonly QuoteSpecLineName[]): readonly string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of lines) {
    if (seen.has(line.name)) {
      continue;
    }
    seen.add(line.name);
    names.push(line.name);
  }
  return names;
}
