

export function getPromptList(limit?: number, startKey: string = "") {
  if(limit) {
    return `/prompt?limit=${limit}&startKey=${startKey}`
  } else {
    return `/prompt`;
  }
}

export function postCreatePrompt() {
  return `/prompt`;
}

export function getPrompt(id: string) {
  return `/prompt/${id}`;
}

export function updatePrompt(id: string) {
  return `/prompt/${id}`;
}