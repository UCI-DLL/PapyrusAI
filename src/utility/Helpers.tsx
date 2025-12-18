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

export function orderCourseRecentlyCreatedAndStarred(list: Array<CourseType>, starred: Array<{ courseId: string }>) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some(m => m.courseId === a.id);
    const bIsFavorite = starred.some(m => m.courseId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by most recent (assuming ISO date string or timestamp)
    return a.id < b.id ? 1 : -1;
  });
}

export function orderModuleRecentlyCreated(list: Array<ModuleType>) {
  return list.sort((a, b) => {
    return a.id < b.id ? 1 : -1;
  })
}

export function orderModuleRecentlyCreatedAndStarred(list: Array<ModuleType>, starred: Array<{ courseId: string, moduleId: string }>) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some(m => m.moduleId === a.id);
    const bIsFavorite = starred.some(m => m.moduleId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by most recent (assuming ISO date string or timestamp)
    return a.id < b.id ? 1 : -1;
  });
}

export function removeSpecialCharacters(str: string) { //note: keep new lines
  return str.replace(/[^a-zA-Z0-9!@#$%^ÁáÉéÍíÓóÚúÑñäöü¡¿()"'.?\-_+=*~<>{},;:&|\s]/g, "");
}

//handle returning the course term in the current language
export function handleCourseTermLanguage(currentLang: string, courseTerm: string): string {
  if (currentLang === "english") {
    return courseTerm
  } else if (currentLang === "spanish") {
    if (courseTerm === "spring") {
      return "Primavera"
    }
    if (courseTerm === "summer") {
      return "Verano"
    }
    if (courseTerm === "fall") {
      return "Otoño"
    }
    if (courseTerm === "winter") {
      return "Invierno"
    }
  }
  return courseTerm
}