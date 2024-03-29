import { ResumeEducation } from "~/lib/redux/types";
import { ResumePDFBulletList, ResumePDFSection, ResumePDFText } from "./common";

export const ResumePDFEducation = ({
  heading,
  educations,
  themeColor,
  showBulletPoints,
}: {
  heading: string;
  educations: ResumeEducation[];
  themeColor: string;
  showBulletPoints: boolean;
}) => {
  return (
    <ResumePDFSection themeColor={themeColor} heading={heading}>
      {educations.map(
        ({ school, degree, date, gpa, descriptions = [] }, idx) => {
          // Hide school name if it is the same as the previous school
          const hideSchoolName =
            idx > 0 && school === educations[idx - 1].school;
          const showDescriptions = descriptions.join() !== "";

          return (
            <div key={idx}>
              {!hideSchoolName && (
                <ResumePDFText bold={true}>{school}</ResumePDFText>
              )}
              <div
                className="flex flex-row justify-between"
                style={{
                  marginTop: hideSchoolName
                    ? "-" + "3pt"
                    : "4.5pt",
                }}
              >
                <ResumePDFText>{`${
                  gpa
                    ? `${degree} - ${Number(gpa) ? gpa + " GPA" : gpa}`
                    : degree
                }`}</ResumePDFText>
                <ResumePDFText>{date}</ResumePDFText>
              </div>
              {showDescriptions && (
                <div className="flex flex-col" style={{ marginTop: "4.5pt" }}>
                  <ResumePDFBulletList
                    items={descriptions}
                    showBulletPoints={showBulletPoints}
                  />
                </div>
              )}
            </div>
          );
        }
      )}
    </ResumePDFSection>
  )
}
