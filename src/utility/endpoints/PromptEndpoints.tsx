//Note: no long in use

export function getPromptList(limit?: number, startKey: string = "") {
  if (limit) {
    return `prompt?limit=${limit}&startKey=${startKey}&organization=${process.env.REACT_APP_ORGANIZATION}`
  } else {
    return `prompt?organization=${process.env.REACT_APP_ORGANIZATION}`;
  }
}

export function postCreatePrompt() {
  return `prompt?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function getPrompt(id: string) {
  return `prompt/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}

export function updatePrompt(id: string) {
  return `prompt/${id}?organization=${process.env.REACT_APP_ORGANIZATION}`;
}