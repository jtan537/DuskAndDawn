using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using Yarn.Unity;
using System;

public class TreeReceiver : MonoBehaviour
{
    private AudioSource treeAudio;
    public Animator ani;
    public GameObject gem;


    TreeQuest quest;

    public Inventory inventory;

    public GameObject InteractTriggerUI;
    public GameObject textObj;

    public string taskName;
    public int assignee;
    public TaskList taskList;
    Task task;

    bool istaskAdded = false;

    void Start()
    {
        ani.SetBool("received", false);
        quest = GameObject.FindObjectOfType<TreeQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        Debug.Log("Tree Quest");
    	IInventoryItem item = e.Item;

        if (item.Name == "Sun")
        {
            item.OnUse();
            inventory.RemoveItem(item);
        }
        if (quest.numRequiredSuns == 0)
        {
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
            ani.SetBool("received", true);
            gem.SetActive(true);

            taskList.UpdateTask(task, taskList);
            taskList.RefreshDisplay();

            GameObject.Find("Dawn").GetComponent<NPCInteract>().Interact();
            quest.numRequiredSuns = -1;
        }
    }
    
    private void CreateTask()
    {
        task = new Task();
        task.taskName = taskName;
        task.status = 0;
        task.assignee = assignee;
    }

    public void OnNodeComplete(String s)
    {
        if (s == "TreeQuest.Activates" && !istaskAdded)
        {
            CreateTask();

            taskList.AddTask(task, taskList);

            istaskAdded = true;
        }
    }
}
