import { MEMBER_ROLES } from "../api/profiles";
import { SelectMenu } from "./SelectMenu";

type Props = {
  role: string;
  company: string;
  onRole: (role: string) => void;
  onCompany: (company: string) => void;
  inputClass: string;
};

/** Signup choice: a recruiter checkbox with a company field, or one of the member roles. */
export function SignupRoleFields({ role, company, onRole, onCompany, inputClass }: Props) {
  const recruiter = role === "Recruiter";

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
        <input
          type="checkbox"
          checked={recruiter}
          onChange={(e) => onRole(e.target.checked ? "Recruiter" : "")}
          className="mt-0.5 h-4 w-4 shrink-0 accent-maroon-800"
        />
        <span className="text-sm">
          <span className="block font-medium text-gray-800">I'm signing up as a recruiter</span>
          <span className="block text-gray-500">You get a guide to finding developers by tech stack, projects, and activity.</span>
        </span>
      </label>

      {recruiter ? (
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-gray-700">Company or agency</label>
          <input id="company" required value={company} onChange={(e) => onCompany(e.target.value)}
            placeholder="Where you recruit from" className={inputClass} />
        </div>
      ) : (
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">I am a</label>
          <SelectMenu id="role" value={role} options={MEMBER_ROLES} placeholder="Choose a role" onChange={onRole} className={inputClass} />
        </div>
      )}
    </div>
  );
}
