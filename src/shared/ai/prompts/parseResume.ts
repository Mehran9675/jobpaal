import type { TaskPrompt } from './system';

export const PARSE_RESUME_PROMPT: TaskPrompt = {
  usesStyle: false,
  instruction:
    'Extract structured profile data from the resume text. Copy facts exactly as written. Only extract what is in the text: never infer, complete or embellish anything. Leave fields empty when the text does not contain them. Dates as YYYY-MM when month and year are given, YYYY when only the year is given, "" otherwise.',
  format: `Return one JSON object:
{
  "basics": { "firstName": string, "lastName": string, "headline": string, "email": string, "phone": string,
              "location": { "city": string, "region": string, "country": string } },
  "links": { "linkedin": string, "github": string, "portfolio": string, "website": string, "twitter": string },
  "summary": string,
  "skills": [{ "name": string (group name, e.g. "Languages"), "skills": string[] }],
  "experience": [{ "company": string, "title": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "description": string, "highlights": string[], "skills": string[] }],
  "education": [{ "institution": string, "degree": string, "field": string, "location": string, "startDate": string, "endDate": string, "grade": string, "description": string }],
  "certifications": [{ "name": string, "issuer": string, "date": string, "expires": string, "credentialId": string, "url": string }],
  "languages": [{ "language": string, "fluency": string }],
  "projects": [{ "name": string, "role": string, "url": string, "startDate": string, "endDate": string, "description": string, "highlights": string[], "skills": string[] }],
  "awards": [{ "title": string, "issuer": string, "date": string, "description": string }]
}`,
};

export function parseResumeUserMessage(text: string): string {
  return `RESUME TEXT:\n"""\n${text}\n"""`;
}
