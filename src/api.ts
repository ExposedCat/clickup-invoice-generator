import { getLastMonth } from './utils.js';

const BASE_ENDPOINT = 'https://api.clickup.com/api/v2';

type TasksAPIResponse = {
  data: {
    task: { id: string; name: string };
    start: number;
    end: number;
  }[];
};

export type Task = {
  name: string;
  time: number;
};

export async function fetchTasks() {
  if (!process.env.CLICKUP_PRIVATE_KEY || !process.env.CLICKUP_TEAM_ID || !process.env.CLICKUP_USER_ID) {
    throw new Error('Cannot parse tasks: CLICKUP_PRIVATE_KEY, CLICKUP_TEAM_ID or CLICKUP_USER_ID is unset');
  }

  const [startOfMonth, endOfMonth] = getLastMonth();
  const params = `assignee=${process.env.CLICKUP_USER_ID}&start_date=${startOfMonth}&end_date=${endOfMonth}`;
  const timeEndpoint = `/team/${process.env.CLICKUP_TEAM_ID}/time_entries?${params}`;

  const result = await fetch(`${BASE_ENDPOINT}${timeEndpoint}`, {
    headers: { Authorization: process.env.CLICKUP_PRIVATE_KEY },
  });
  const response: TasksAPIResponse = await result.json();

  const tasks: Record<string, Task> = {};
  for (const task of response.data) {
    const {
      task: { id, name },
      start,
      end,
    } = task;
    tasks[id] ??= { name, time: 0 };
    tasks[id].time += end - start;
  }

  return tasks;
}
