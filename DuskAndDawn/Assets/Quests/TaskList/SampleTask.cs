using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class SampleTask : MonoBehaviour
{

	public Image taskImage;
	public TextMeshProUGUI taskName;
	public Image reward;
	public TextMeshProUGUI assignee;

	public Sprite DawnGem;
	public Sprite DuskGem;

	private Task task;
	private TaskList taskList;

    public void Setup(Task currentTask, TaskList currentTaskList)
    {
    	task = currentTask;
        taskName.text = task.taskName;
        if (task.status == 0)
        {
        	reward.enabled = false;
        }
        else
        {
            reward.enabled = true;

        	if (task.assignee == 0)
        	{
        		reward.sprite = DawnGem;
        	}
        	else
        	{
        		reward.sprite = DuskGem;
        	}
        }
        
        if (task.assignee == 0)
    	{
    		assignee.text = "Dawn";
    	}
    	else
    	{
    		assignee.text = "Dusk";
    	}

        taskList = currentTaskList;
    }
}
