import fs from 'node:fs';
// read "./202501.json" as a JSON object and then map over the "data" array

const data = JSON.parse(fs.readFileSync('./202501.json', 'utf8'));

// {"areas":[],"classnotes":"","colsem":false,"course_flags":[],"course_id":117958,"course_professors":[{"professor":{"professor_id":7106,"name":"Roger Cohn"}}],"credits":0,"description":"This course is aimed at helping students improve their writing. The goal is to develop writing skills and make students better able to communicate their work and ideas through writing that is clear, accessible, and free of jargon. Students are required to write every week throughout the course: short assignments (600–800 words) each week, and one longer assignment (1,500–2,000 words) due at the end of the term.","extra_info":"ACTIVE","final_exam":"","fysem":false,"last_offered_course_id":108441,"listings":[{"course_code":"ENV 625","crn":26095,"number":"625","school":"FS","subject":"ENV"}],"regnotes":"","requirements":"","rp_attr":"","same_course_and_profs_id":53967,"same_course_id":53967,"season_code":"202501","section":"1","skills":[],"syllabus_url":"https://yale.instructure.com/courses/107219/assignments/syllabus","sysem":false,"course_meetings":[{"days_of_week":4,"start_time":"13:00","end_time":"15:50","location":null}],"title":"Writing Workshop"}
const descriptions = data.map((item) => {
	const courseCode = item.listings[0]?.course_code || 'No code';
	const professor =
		item.course_professors[0]?.professor?.name || 'No professor';
	const credits = item.credits || 'N/A';

	return `"${courseCode} - ${item.title}": {
	Professor: ${professor}
	Credits: ${credits}
	Description: "${item.description}"
}`;
});

console.log(descriptions);
// write the descriptions to a new file

fs.writeFileSync('./descriptions.txt', descriptions.join('\n'));
