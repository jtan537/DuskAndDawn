using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using System.Collections.Generic;

[System.Serializable]
public class Task
{
    public string taskName;
    public int status = 0;
    public int assignee;
}

public class TaskList : MonoBehaviour
{
	public List<Task> taskList;
	public Transform contentPanel;
	public SimpleObjectPool taskObjectPool;

    public void RefreshDisplay()
    {
        RemoveTasks();
        AddTasks ();
    }

    private void AddTasks()
    {
        for (int i = 0; i < taskList.Count; i++) 
        {
            Task task = taskList[i];
            GameObject newTask = taskObjectPool.GetObject();
            newTask.transform.SetParent(contentPanel);

            SampleTask sampleTask = newTask.GetComponent<SampleTask>();
            sampleTask.Setup(task, this);
        }
    }

    private void RemoveTasks()
    {
        while (contentPanel.childCount > 0) 
        {
            GameObject toRemove = transform.GetChild(0).gameObject;
            taskObjectPool.ReturnObject(toRemove);
        }
    }

    public void AddTask(Task taskToAdd, TaskList taskListClass)
    {
        taskListClass.taskList.Add (taskToAdd);

        Task task = taskToAdd;
        GameObject newTask = taskObjectPool.GetObject();
        newTask.transform.SetParent(contentPanel);

        SampleTask sampleTask = newTask.GetComponent<SampleTask>();
        sampleTask.Setup(task, this);
    }

    public void UpdateTask(Task taskToUpdate, TaskList taskListClass)
    {
        for (int i = 0; i < taskList.Count; i++) 
        {
            if (taskListClass.taskList[i] == taskToUpdate)
            {
                taskListClass.taskList[i].status = 1;
            }
        }
    }
}