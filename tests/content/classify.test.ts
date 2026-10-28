import { describe, expect, it } from 'vitest';
import { classifyField } from '@/content/autofill/classify';

const cases: [Parameters<typeof classifyField>[0], string | null][] = [
  [{ type: 'text', label: 'First Name' }, 'firstName'],
  [{ type: 'text', label: 'Last name' }, 'lastName'],
  [{ type: 'text', label: 'Full name' }, 'fullName'],
  [{ type: 'text', label: 'Name' }, 'fullName'],
  [{ type: 'text', label: '', name: 'job_application[first_name]' }, 'firstName'],
  [{ type: 'text', label: 'Company name' }, 'currentCompany'],
  [{ type: 'email', label: 'Your e-mail' }, 'email'],
  [{ type: 'tel', label: 'Contact' }, 'phone'],
  [{ type: 'text', label: 'Mobile phone number' }, 'phone'],
  [{ type: 'text', label: 'Phone type' }, null],
  [{ type: 'text', label: 'Anything', autocomplete: 'section-x given-name' }, 'firstName'],
  [{ type: 'text', label: 'LinkedIn Profile' }, 'linkedin'],
  [{ type: 'url', label: 'GitHub URL' }, 'github'],
  [{ type: 'text', label: 'Portfolio' }, 'portfolio'],
  [{ type: 'text', label: 'Website' }, 'website'],
  [{ type: 'text', label: 'City' }, 'city'],
  [{ type: 'text', label: 'Location (City, State)' }, 'location'],
  [{ type: 'text', label: 'ZIP / Postal code' }, 'postalCode'],
  [{ type: 'select', label: 'Country' }, 'country'],
  [{ type: 'text', label: 'Current job title' }, 'currentTitle'],
  [{ type: 'text', label: 'Current employer' }, 'currentCompany'],
  [{ type: 'text', label: 'Years of experience' }, 'yearsExperience'],
  [{ type: 'text', label: 'How many years of experience do you have with Kubernetes?' }, null],
  [{ type: 'text', label: 'University' }, 'school'],
  [{ type: 'select', label: 'Degree' }, 'degree'],
  [{ type: 'text', label: 'Field of study' }, 'fieldOfStudy'],
  [{ type: 'text', label: 'Graduation year' }, 'graduationYear'],
  [{ type: 'radio', label: 'Are you legally authorized to work in the United States?' }, 'authorizedToWork'],
  [{ type: 'select', label: 'Will you now or in the future require sponsorship for employment visa status?' }, 'requiresSponsorship'],
  [{ type: 'radio', label: 'Are you willing to relocate?' }, 'willingToRelocate'],
  [{ type: 'text', label: 'Notice period' }, 'noticePeriod'],
  [{ type: 'text', label: 'Earliest start date' }, 'availableFrom'],
  [{ type: 'text', label: 'What are your salary expectations?' }, 'salaryExpectation'],
  [{ type: 'select', label: 'Gender' }, 'gender'],
  [{ type: 'select', label: 'Pronouns' }, 'pronouns'],
  [{ type: 'select', label: 'Are you Hispanic/Latino?' }, 'ethnicity'],
  [{ type: 'select', label: 'Race' }, 'race'],
  [{ type: 'select', label: 'Veteran Status' }, 'veteranStatus'],
  [{ type: 'select', label: 'Disability Status' }, 'disabilityStatus'],
  [{ type: 'select', label: 'Sexual orientation' }, 'sexualOrientation'],
  [{ type: 'textarea', label: 'Cover Letter' }, 'coverLetterText'],
  [{ type: 'textarea', label: 'Motivation letter' }, 'coverLetterText'],
  [{ type: 'file', label: 'Resume/CV' }, 'resumeFile'],
  [{ type: 'file', label: 'Attach', name: 'cover_letter' }, 'coverLetterFile'],
  [{ type: 'textarea', label: 'Why do you want to work at Acme?' }, null],
  [{ type: 'text', label: 'How did you hear about us?' }, null],
];

describe('classifyField', () => {
  it.each(cases)('%j → %s', (input, expected) => {
    expect(classifyField(input)).toBe(expected);
  });
});
