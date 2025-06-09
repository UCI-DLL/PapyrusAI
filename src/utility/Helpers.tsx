import { CourseType, ModuleType } from "./types/CourseTypes";

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

  if (value === "") return true

  if (re.test(value)) {
    return true
  } else {
    return false
  }
}

export function onlyLettersAndNumbers(str: string) {
  return Boolean(str.match(/^[A-Za-z0-9]*$/));
}

export function truncateString(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
  }
  return str;
}


export function orderCourseAlphabetically(list: Array<CourseType>) {
  return list.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
}

export function orderModuleAlphabetically(list: Array<ModuleType>) {
  return list.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
}

export function orderCourseRecentlyCreated(list: Array<CourseType>) {
  return list.sort((a, b) => {
    return a.createdTimestamp < b.createdTimestamp ? 1 : -1;
  })
}

export function orderModuleRecentlyCreated(list: Array<ModuleType>) {
  return list.sort((a, b) => {
    return a.id < b.id ? 1 : -1;
  })
}

export function removeSpecialCharacters(str: string) {
  return str.replace(/[^a-zA-Z0-9!@#$%^()"'.?-_+=*~<>,;:&|\s]/g, "");
}