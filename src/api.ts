import { getLastMonth, getThisMonth } from './utils.js';

const BASE_ENDPOINT = 'https://api.clickup.com/api/v2';

type TasksAPIResponse = {
  data: {
    task: { id: string; name: string };
    start: number;
    end: number;
  }[];
};

export type Task = {
  id: string;
  name: string;
  time: number;
};

export type FetchTasksArgs = {
  clickUp: {
    privateKey: string;
    teamId: string;
    userId: string;
  };
  period?: 'last' | 'this';
};

export async function fetchTasks(args: FetchTasksArgs) {
  const {
    clickUp: { privateKey, teamId, userId },
    period = 'this',
  } = args;

  const [startOfMonth, endOfMonth] = (period === 'last' ? getLastMonth : getThisMonth)();
  const params = `assignee=${userId}&start_date=${startOfMonth}&end_date=${endOfMonth}`;
  const timeEndpoint = `/team/${teamId}/time_entries?${params}`;

  const result = await fetch(`${BASE_ENDPOINT}${timeEndpoint}`, {
    headers: { Authorization: privateKey },
  });
  const response: TasksAPIResponse = await result.json();

  const tasks: Record<string, Task> = {};
  for (const task of response.data) {
    const {
      task: { id, name },
      start,
      end,
    } = task;
    tasks[id] ??= { name, time: 0, id };
    tasks[id].time += end - start;
  }

  const taskList = Object.values(tasks).sort((a, b) => b.time - a.time);

  return taskList;
}
