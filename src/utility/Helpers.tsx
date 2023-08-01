/**
 * Get a random integer between min and max
 * @param min
 * @param max
 * @returns
 */
export function getRandomIntRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Get a random integer between 0 and max
 * @param max
 * @returns
 */
export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

// export default getRandomIntRange;


/**
 * Validates email string
 * @returns true if is valid email
 * @returns false is NOT valid email
 */
 export default function emailValidation(value: string) {
  let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if(value === "") return true

  if(re.test(value)) {
    return true
  } else {
    return false
  }
}