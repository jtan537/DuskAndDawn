using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

public class CatReceiver : MonoBehaviour
{
    public GameObject gem;

    CatQuest quest;

    public Inventory inventory;

    public GameObject InteractTriggerUI;
    public GameObject textObj;

    public TaskList taskList;
    Task task;
    public string taskName;
    public int assignee;

    bool istaskAdded = false;

    void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        IInventoryItem item = e.Item;

        if (item.Name == "MoonFlower")
        {
            item.OnUse();
            inventory.RemoveItem(item);
        }

        if (quest.numRequiredFlowers == 0)
        {
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
            gem.SetActive(true);
            taskList.UpdateTask(task, taskList);
            taskList.RefreshDisplay();
            GameObject.Find("Dusk").GetComponent<NPCInteract>().Interact();
            quest.numRequiredFlowers = -1;
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
        if (s == "Quest.Activates" && !istaskAdded)
        {
            CreateTask();

            taskList.AddTask(task, taskList);

            istaskAdded = true;
        }
    }
}
