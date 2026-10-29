// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AssignWorkPage } from './AssignWorkPage';
import { adminApi } from '../../services/api';
const mocks = vi.hoisted(() => ({ assignTask: vi.fn() }));
vi.mock('../../auth/authContext', () => ({
  useAuth: () => ({
    user: { id: 'lead', email: 'lead@example.com', role: 'TEAM_LEADER', team: 'Tech', managedTeamIds:['team-tech'] },
  }),
}));
vi.mock('../../context/TaskContext', () => ({
  useTasks: () => ({ assignTask: mocks.assignTask }),
}));
vi.mock('../../services/api', () => ({ adminApi: { getTeams: vi.fn(), getUsers: vi.fn() } }));
vi.mock('../../components/tour/HelpButton', () => ({ HelpButton: () => null }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(adminApi.getTeams).mockResolvedValue([{ id: 'team-tech', slug: 'tech', name: 'Tech' }]);
  vi.mocked(adminApi.getUsers).mockResolvedValue([
    {
      id: 'member',
      name: 'Member Name',
      email: 'member@example.com',
      role: 'USER',
      isActive: true,
      createdAt: '',
      memberships: [{ team: { id: 'team-tech', slug: 'tech', name: 'Tech' }, isTeamHead: false }],
    },
  ]);
});
afterEach(cleanup);
async function fill(description = 'Build the task dashboard UI.') {
  render(
    <MemoryRouter>
      <AssignWorkPage />
    </MemoryRouter>,
  );
  await screen.findByRole('option', { name: /Member Name/ });
  fireEvent.change(screen.getByLabelText(/Select Verified Member/), {
    target: { value: 'member' },
  });
  fireEvent.change(screen.getByLabelText(/Task Title/), { target: { value: 'New Task' } });
  fireEvent.change(screen.getByLabelText(/Task Description/), { target: { value: description } });
  fireEvent.change(screen.getByLabelText(/Deadline/), {
    target: { value: `${new Date().getFullYear() + 1}-10-27` },
  });
}
it('rejects the screenshot description beside Description without sending the request', async () => {
  await fill('asdasd');
  fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Task description must be at least 10 characters.'),
  );
  const description = screen.getByLabelText(/Task Description/);
  expect(description.getAttribute('aria-describedby')).toBe('assign-task-description-error');
  expect(document.activeElement).toBe(description);
  expect(screen.getByLabelText(/Task Title/).getAttribute('aria-invalid')).toBe('false');
  expect(mocks.assignTask).not.toHaveBeenCalled();
});
it('trims text, validates the exact minimums, and submits a valid assignment', async () => {
  mocks.assignTask.mockResolvedValue({ id: 'saved' });
  await fill('   Build a UI  ');
  fireEvent.change(screen.getByLabelText(/Task Title/), { target: { value: '  API  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
  await screen.findByText('Task Assigned Successfully!');
  expect(mocks.assignTask).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'API',
      description: 'Build a UI',
      teamId: 'team-tech',
      assigneeId: 'member',
    }),
  );
});
it.each([
  ['description', 'Task Description', 'assign-task-description-error'],
  ['teamId', 'Select Team', 'assign-team-select-error'],
  ['assigneeId', 'Select Verified Member', 'assign-member-select-error'],
  ['deadline', 'Deadline', 'assign-task-deadline-error'],
])(
  'shows server validation for %s beside its field and retains input',
  async (field, label, errorId) => {
    mocks.assignTask.mockRejectedValue(
      Object.assign(new Error('Invalid request data'), {
        data: {
          error: { code: 'VALIDATION_ERROR', details: { [field]: ['Please correct this field.'] } },
        },
      }),
    );
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
    await screen.findByText('Please correct this field.');
    expect(screen.getByLabelText(new RegExp(label)).getAttribute('aria-describedby')).toBe(errorId);
    expect((screen.getByLabelText(/Task Title/) as HTMLInputElement).value).toBe('New Task');
    expect((screen.getByLabelText(/Task Description/) as HTMLTextAreaElement).value).toBe(
      'Build the task dashboard UI.',
    );
    expect(screen.queryByText('Task Assigned Successfully!')).toBeNull();
  },
);
it('shows permission or connection failures at form level rather than marking the title invalid', async () => {
  mocks.assignTask.mockRejectedValue(new Error('You cannot manage this team'));
  await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Assign Task' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'You cannot manage this team',
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Assign Task' }).hasAttribute('disabled')).toBe(
      false,
    ),
  );
  expect(screen.getByLabelText(/Task Title/).getAttribute('aria-invalid')).toBe('false');
});

it('does not offer unrelated squads when the lead has no matching management grant',async()=>{
  vi.mocked(adminApi.getTeams).mockResolvedValue([{id:'other-team',slug:'media',name:'Media'}]);
  render(<MemoryRouter><AssignWorkPage/></MemoryRouter>);
  await waitFor(()=>expect(adminApi.getTeams).toHaveBeenCalled());
  expect(screen.queryByRole('option',{name:'Media'})).toBeNull();
});
