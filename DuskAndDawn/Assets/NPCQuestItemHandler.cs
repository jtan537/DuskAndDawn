using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NPCQuestItemHandler : MonoBehaviour
{
    // Start is called before the first frame update
    public static NPCQuestItemHandler ActiveNPCQuestItemHandler { get; private set; }

    bool activatedQuest = false;
    ItemClickHandler[] handlers;
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        activatedQuest = gameObject.GetComponentInParent<NPC>().activatedQuest;
        handlers = gameObject.GetComponentInParent<NPC>().handlers;

    }
    private void OnTriggerEnter(Collider collision)
    {
        if (collision.name == gameObject.tag)
        {
            SetActiveNPCQuestItemHandler(true);
            if (activatedQuest){
                Debug.Log("Active");
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }
            
        }
    }

    private void OnTriggerStay(Collider collision)
    {
        if (collision.name == gameObject.tag)
        {
            SetActiveNPCQuestItemHandler(true);
            if (activatedQuest)
            {
                Debug.Log("Active");
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = true;
                }
            }

        }
    }

    private void OnTriggerExit(Collider collision)
    {
        if (collision.name == gameObject.tag)
        {
            SetActiveNPCQuestItemHandler(false);
            if (activatedQuest)
            {
                Debug.Log("Active");
                foreach (ItemClickHandler handler in handlers)
                {
                    handler.active = false;
                }
            }

        }
    }

    public void SetActiveNPCQuestItemHandler(bool set)
    {
        ActiveNPCQuestItemHandler = set ? this : null;
    }

}
